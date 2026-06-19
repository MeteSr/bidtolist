/**
 * BidtoList Listing Canister
 *
 * Sealed-bid marketplace: homeowners post listing bid requests, agents compete
 * with blind proposals (hidden until bidDeadline passes), homeowner accepts winner.
 *
 * On acceptProposal, a platform fee record is created in the fee canister.
 *
 * Lifted from HomeGentic's listing canister; FSBO/photos/panoramas/trust-signals removed.
 */

import Array    "mo:core/Array";
import Char     "mo:core/Char";
import Map      "mo:core/Map";
import Int      "mo:core/Int";
import Iter     "mo:core/Iter";
import Nat      "mo:core/Nat";
import Option   "mo:core/Option";
import Principal "mo:core/Principal";
import Result   "mo:core/Result";
import Text     "mo:core/Text";
import Time     "mo:core/Time";


persistent actor Listing {

  // ─── Types ──────────────────────────────────────────────────────────────────

  public type BidRequestStatus = { #Open; #Awarded; #Cancelled; #Expired };
  public type ProposalStatus   = { #Pending; #Accepted; #Rejected; #Withdrawn; #Standby };

  // Cascade state for a single request: payment deadline for the current winner
  // and the ordered list of backup proposal IDs not yet offered.
  // deadline = 0 means cascade is inactive (paid or exhausted).
  public type CascadeState = {
    deadline : Int;
    backups  : [Text];
  };

  public type PendingNotification = {
    id        : Text;
    requestId : Text;
    createdAt : Int;
  };

  public type Error = {
    #NotFound;
    #NotAuthorized;
    #InvalidInput: Text;
    #AlreadyCancelled;
    #DeadlinePassed;
  };

  public type HomeownerVerificationRequest = {
    id:           Text;
    principal:    Principal;
    address:      Text;
    parcelNumber: Text;
    contactEmail: Text;
    submittedAt:  Time.Time;
  };

  public type DocType = { #photoId; #ownershipProof; #selfie; #authorizationDoc };

  public type VerificationDoc = {
    id:         Text;
    requestId:  Text;
    principal:  Principal;
    docType:    DocType;
    blob:       Blob;
    uploadedAt: Time.Time;
  };

  public type BidRequestSummary = {
    id:               Text;
    city:             Text;
    county:           Text;
    zipCode:          Text;
    targetListDate:   Time.Time;
    desiredSalePrice: ?Nat;
    beds:             ?Nat;
    baths:            ?Nat;
    sqft:             ?Nat;
    notes:            Text;
    bidDeadline:      Time.Time;
    status:           BidRequestStatus;
    createdAt:        Time.Time;
    proposalCount:    Nat;
  };

  public type ListingBidRequest = {
    id:               Text;
    address:          Text;
    city:             Text;
    county:           Text;
    zipCode:          Text;
    homeowner:        Principal;
    homeownerEmail:   Text;
    targetListDate:   Time.Time;
    desiredSalePrice: ?Nat;
    beds:             ?Nat;
    baths:            ?Nat;
    sqft:             ?Nat;
    notes:            Text;
    bidDeadline:      Time.Time;
    status:           BidRequestStatus;
    createdAt:        Time.Time;
    feePaid:          Bool;
  };

  public type ListingProposal = {
    id:                    Text;
    requestId:             Text;
    agentId:               Principal;
    agentName:             Text;
    agentEmail:            Text;
    agentBrokerage:        Text;
    commissionBps:         Nat;
    cmaSummary:            Text;
    marketingPlan:         Text;
    estimatedDaysOnMarket: Nat;
    estimatedSalePrice:    Nat;
    includedServices:      [Text];
    validUntil:            Time.Time;
    coverLetter:           Text;
    status:                ProposalStatus;
    createdAt:             Time.Time;
  };

  public type Metrics = {
    totalRequests:    Nat;
    openRequests:     Nat;
    awardedRequests:  Nat;
    expiredRequests:  Nat;
    totalProposals:   Nat;
    isPaused:         Bool;
  };

  // ─── Stable State ────────────────────────────────────────────────────────────

  private let MAX_PROPOSALS_PER_REQUEST : Nat = 10;

  private var bidCounter:          Nat = 0;
  private var proposalCounter:     Nat = 0;
  private var isPaused:            Bool = false;
  private var pauseExpiryNs:       ?Int = null;
  private var adminListEntries:    [Principal] = [];
  private var adminInitialized:    Bool = false;
  private var feeCanisterId:       Text = "";
  private var platformFeeCents:    Nat = 29500; // $295.00 default
  private var agentCanisterId:     Text = "";
  // Vuln 1: explicit flag instead of map-size heuristic; admin must call enableVerification()
  private var verificationEnabled: Bool = false;

  private let requests              = Map.empty<Text, ListingBidRequest>();
  private let proposals             = Map.empty<Text, ListingProposal>();
  private let revealNotifiedSet     = Map.empty<Text, Bool>();
  private let verifiedHomeowners    = Map.empty<Principal, Bool>();
  private let verificationRequests  = Map.empty<Text, HomeownerVerificationRequest>();
  private var verificationCounter:  Nat = 0;
  private let verificationDocs      = Map.empty<Text, VerificationDoc>();
  private var docCounter:           Nat = 0;

  // ─── Cascade State ────────────────────────────────────────────────────────────

  private let HOURS_NS : Int = 3_600_000_000_000;

  private let cascadeState          = Map.empty<Text, CascadeState>();
  private let pendingNotifications  = Map.empty<Text, PendingNotification>();
  /// requestId → true while a submitProposal await is in flight; transient so it clears on upgrade
  private transient let inFlightProposals = Map.empty<Text, Bool>();
  private var notificationCounter : Nat = 0;
  // Kept for stable memory layout compatibility — no longer used (heartbeat removed).
  private var heartbeatTick       : Nat = 0;
  private let CASCADE_CHECK_INTERVAL : Nat = 60;

  // ─── Rate Limit ──────────────────────────────────────────────────────────────

  private let updateCallLimits : Map.Map<Text, (Nat, Int)> = Map.empty();
  private var maxUpdatesPerMin : Nat = 30;
  private let ONE_MINUTE_NS : Int = 60_000_000_000;

  system func inspect({ caller : Principal; arg : Blob }) : Bool {
    not Principal.isAnonymous(caller) and arg.size() > 0
  };

  private func tryConsumeUpdateSlot(caller: Principal) : Bool {
    if (isAdmin(caller)) return true;
    let key = Principal.toText(caller);
    let now = Time.now();
    switch (Map.get(updateCallLimits, Text.compare, key)) {
      case null { Map.add(updateCallLimits, Text.compare, key, (1, now)); true };
      case (?(count, windowStart)) {
        if (now - windowStart >= ONE_MINUTE_NS) { Map.add(updateCallLimits, Text.compare, key, (1, now)); true }
        else if (maxUpdatesPerMin > 0 and count >= maxUpdatesPerMin) { false }
        else { Map.add(updateCallLimits, Text.compare, key, (count + 1, windowStart)); true }
      };
    }
  };

  private func isAdmin(caller: Principal) : Bool {
    Option.isSome(Array.find<Principal>(adminListEntries, func(a) { a == caller }))
  };

  private func requireActive(caller: Principal) : Result.Result<(), Error> {
    if (Principal.isAnonymous(caller)) return #err(#NotAuthorized);
    if (isPaused) {
      switch (pauseExpiryNs) {
        case (?expiry) { if (Time.now() < expiry) return #err(#InvalidInput("Canister is paused")) };
        case null { return #err(#InvalidInput("Canister is paused")) };
      };
    };
    if (not tryConsumeUpdateSlot(caller)) {
      return #err(#InvalidInput("Rate limit exceeded. Max " # Nat.toText(maxUpdatesPerMin) # " update calls per minute per principal."))
    };
    #ok(())
  };

  // Returns true if the caller has an accepted proposal on the given request.
  private func hasAcceptedProposal(requestId: Text, caller: Principal) : Bool {
    Option.isSome(
      Array.find<ListingProposal>(
        Iter.toArray(Map.values(proposals)),
        func(p: ListingProposal) : Bool {
          p.requestId == requestId and p.agentId == caller and p.status == #Accepted
        }
      )
    )
  };

  private func nextBidId() : Text {
    bidCounter += 1;
    "BID_" # Nat.toText(bidCounter)
  };

  private func nextProposalId() : Text {
    proposalCounter += 1;
    "PROP_" # Nat.toText(proposalCounter)
  };

  private func nextVerificationId() : Text {
    verificationCounter += 1;
    "VER_" # Nat.toText(verificationCounter)
  };

  private func nextDocId() : Text {
    docCounter += 1;
    "DOC_" # Nat.toText(docCounter)
  };

  // ─── Homeowner: Bid Request Lifecycle ────────────────────────────────────────

  public shared(msg) func createBidRequest(
    address:          Text,
    city:             Text,
    county:           Text,
    zipCode:          Text,
    targetListDate:   Int,
    desiredSalePrice: ?Nat,
    beds:             ?Nat,
    baths:            ?Nat,
    sqft:             ?Nat,
    notes:            Text,
    bidDeadline:      Int,
    homeownerEmail:   Text
  ) : async Result.Result<ListingBidRequest, Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };

    // Vuln 1 fix: explicit flag — no map-size bypass
    if (verificationEnabled) {
      if (Map.get(verifiedHomeowners, Principal.compare, msg.caller) == null) {
        return #err(#NotAuthorized);
      };
    };

    if (Text.size(address) == 0)  return #err(#InvalidInput("address cannot be empty"));
    if (Text.size(city) == 0)     return #err(#InvalidInput("city cannot be empty"));
    if (Text.size(county) == 0)   return #err(#InvalidInput("county cannot be empty"));
    if (Text.size(notes) > 5000)  return #err(#InvalidInput("notes exceeds 5000 characters"));
    if (bidDeadline <= Time.now()) return #err(#InvalidInput("bidDeadline must be in the future"));

    let id = nextBidId();
    let req: ListingBidRequest = {
      id;
      address;
      city;
      county;
      zipCode;
      homeowner        = msg.caller;
      homeownerEmail;
      targetListDate;
      desiredSalePrice;
      beds;
      baths;
      sqft;
      notes;
      bidDeadline;
      status           = #Open;
      createdAt        = Time.now();
      feePaid          = false;
    };
    Map.add(requests, Text.compare, id, req);
    #ok(req)
  };

  public query(msg) func getMyBidRequests() : async [ListingBidRequest] {
    Iter.toArray(
      Iter.filter(Map.values(requests), func(r: ListingBidRequest) : Bool {
        r.homeowner == msg.caller
      })
    )
  };

  /// Vuln 4 fix: only homeowner, admin, or winning agent receives PII fields (address, homeownerEmail).
  /// All other authenticated callers get the record with those fields redacted.
  public shared query(msg) func getBidRequest(id: Text) : async Result.Result<ListingBidRequest, Error> {
    if (Principal.isAnonymous(msg.caller)) return #err(#NotAuthorized);
    switch (Map.get(requests, Text.compare, id)) {
      case null { #err(#NotFound) };
      case (?r) {
        let privileged = r.homeowner == msg.caller
          or isAdmin(msg.caller)
          or (hasAcceptedProposal(id, msg.caller) and r.feePaid);
        if (privileged) {
          #ok(r)
        } else {
          // Return non-PII fields; address and homeownerEmail are blanked for non-privileged callers
          #ok({
            id = r.id; address = ""; city = r.city; county = r.county;
            zipCode = r.zipCode; homeowner = r.homeowner; homeownerEmail = "";
            targetListDate = r.targetListDate; desiredSalePrice = r.desiredSalePrice;
            beds = r.beds; baths = r.baths; sqft = r.sqft;
            notes = r.notes; bidDeadline = r.bidDeadline;
            status = r.status; createdAt = r.createdAt; feePaid = false;
          })
        }
      };
    }
  };

  public shared(msg) func cancelBidRequest(id: Text) : async Result.Result<(), Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };
    switch (Map.get(requests, Text.compare, id)) {
      case null    { #err(#NotFound) };
      case (?req) {
        if (req.homeowner != msg.caller) return #err(#NotAuthorized);
        if (req.status == #Cancelled)    return #err(#AlreadyCancelled);
        if (req.status != #Open)         return #err(#InvalidInput("Request is not open"));
        Map.add(requests, Text.compare, id, {
          id = req.id; address = req.address; city = req.city;
          county = req.county; zipCode = req.zipCode;
          homeowner = req.homeowner; homeownerEmail = req.homeownerEmail;
          targetListDate = req.targetListDate;
          desiredSalePrice = req.desiredSalePrice;
          beds = req.beds; baths = req.baths; sqft = req.sqft;
          notes = req.notes;
          bidDeadline = req.bidDeadline; status = #Cancelled; createdAt = req.createdAt;
          feePaid = req.feePaid;
        });
        #ok(())
      };
    }
  };

  /// Mark #Open listings whose deadline has passed with zero proposals as #Expired.
  /// Anyone may call; this only advances the lifecycle, never reverses it.
  public shared func expireStaleListings() : async Nat {
    let now = Time.now();
    let stale = Iter.toArray(Iter.filter(Map.values(requests), func(r: ListingBidRequest) : Bool {
      r.status == #Open and r.bidDeadline < now and
      Iter.size(Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool {
        p.requestId == r.id
      })) == 0
    }));
    for (req in stale.vals()) {
      Map.add(requests, Text.compare, req.id, {
        id = req.id; address = req.address; city = req.city;
        county = req.county; zipCode = req.zipCode;
        homeowner = req.homeowner; homeownerEmail = req.homeownerEmail;
        targetListDate = req.targetListDate; desiredSalePrice = req.desiredSalePrice;
        beds = req.beds; baths = req.baths; sqft = req.sqft;
        notes = req.notes; bidDeadline = req.bidDeadline;
        status = #Expired; createdAt = req.createdAt; feePaid = req.feePaid;
      });
    };
    stale.size()
  };

  /// Atomically marks a listing's reveal notification as sent. Returns true only on the
  /// first call; subsequent calls return false so the Worker skips the duplicate send.
  public shared(msg) func markRevealNotified(requestId: Text) : async Bool {
    switch (requireActive(msg.caller)) { case (#err(_)) return false; case _ {} };
    switch (Map.get(revealNotifiedSet, Text.compare, requestId)) {
      case (?_) { false };
      case null {
        Map.add(revealNotifiedSet, Text.compare, requestId, true);
        true
      };
    }
  };

  /// Returns open listings whose bid deadline falls within the next `windowNs` nanoseconds.
  /// Used by the Cloudflare Worker cron to identify listings needing deadline reminders.
  public shared query(msg) func getListingsNearDeadline(windowNs: Int) : async [BidRequestSummary] {
    if (Principal.isAnonymous(msg.caller)) return [];
    let now    = Time.now();
    let cutoff = now + windowNs;
    let near   = Iter.filter(Map.values(requests), func(r: ListingBidRequest) : Bool {
      r.status == #Open and r.bidDeadline > now and r.bidDeadline <= cutoff
    });
    Iter.toArray(Iter.map(near, func(r: ListingBidRequest) : BidRequestSummary {
      let count = Iter.size(Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool {
        p.requestId == r.id
      }));
      {
        id = r.id; city = r.city; county = r.county; zipCode = r.zipCode;
        targetListDate = r.targetListDate; desiredSalePrice = r.desiredSalePrice;
        beds = r.beds; baths = r.baths; sqft = r.sqft;
        notes = r.notes; bidDeadline = r.bidDeadline;
        status = r.status; createdAt = r.createdAt; proposalCount = count;
      }
    }))
  };

  /// Agents browse open bid requests. Requires a non-anonymous caller (must be logged in).
  public shared query(msg) func getOpenBidRequests() : async [BidRequestSummary] {
    if (Principal.isAnonymous(msg.caller)) return [];
    let open = Iter.filter(Map.values(requests), func(r: ListingBidRequest) : Bool {
      r.status == #Open
    });
    Iter.toArray(Iter.map(open, func(r: ListingBidRequest) : BidRequestSummary {
      let count = Iter.size(Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool {
        p.requestId == r.id
      }));
      {
        id               = r.id;
        city             = r.city;
        county           = r.county;
        zipCode          = r.zipCode;
        targetListDate   = r.targetListDate;
        desiredSalePrice = r.desiredSalePrice;
        beds             = r.beds;
        baths            = r.baths;
        sqft             = r.sqft;
        notes            = r.notes;
        bidDeadline      = r.bidDeadline;
        status           = r.status;
        createdAt        = r.createdAt;
        proposalCount    = count;
      }
    }))
  };

  /// Returns open listings filtered by city. Requires a non-anonymous caller.
  public shared query(msg) func getOpenBidRequestsForCities(cities: [Text]) : async [BidRequestSummary] {
    if (Principal.isAnonymous(msg.caller)) return [];
    let lower = func(t: Text) : Text {
      Text.fromIter(Iter.map(Text.toIter(t), func(c: Char) : Char {
        let n = Char.toNat32(c);
        if (n >= 65 and n <= 90) { Char.fromNat32(n + 32) } else { c }
      }))
    };
    let normalised = Array.map<Text, Text>(cities, lower);
    let open = Iter.filter(Map.values(requests), func(r: ListingBidRequest) : Bool {
      r.status == #Open and
      Option.isSome(Array.find<Text>(normalised, func(c) { c == lower(r.city) }))
    });
    Iter.toArray(Iter.map(open, func(r: ListingBidRequest) : BidRequestSummary {
      let count = Iter.size(Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool {
        p.requestId == r.id
      }));
      {
        id               = r.id;
        city             = r.city;
        county           = r.county;
        zipCode          = r.zipCode;
        targetListDate   = r.targetListDate;
        desiredSalePrice = r.desiredSalePrice;
        beds             = r.beds;
        baths            = r.baths;
        sqft             = r.sqft;
        notes            = r.notes;
        bidDeadline      = r.bidDeadline;
        status           = r.status;
        createdAt        = r.createdAt;
        proposalCount    = count;
      }
    }))
  };

  // ─── Agent: Proposal Lifecycle ────────────────────────────────────────────────

  /// Submit a proposal. Sealed until bidDeadline — server enforces the reveal gate in getProposalsForRequest.
  public shared(msg) func submitProposal(
    requestId:             Text,
    agentName:             Text,
    agentEmail:            Text,
    agentBrokerage:        Text,
    commissionBps:         Nat,
    cmaSummary:            Text,
    marketingPlan:         Text,
    estimatedDaysOnMarket: Nat,
    estimatedSalePrice:    Nat,
    includedServices:      [Text],
    validUntil:            Int,
    coverLetter:           Text
  ) : async Result.Result<ListingProposal, Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };

    // Guard: only one submission per request at a time to prevent concurrent callers from
    // both passing the existingCount < MAX check before either write lands.
    switch (Map.get(inFlightProposals, Text.compare, requestId)) {
      case (?_) { return #err(#InvalidInput("Another proposal is being processed for this request; please retry shortly")) };
      case null {};
    };
    Map.add(inFlightProposals, Text.compare, requestId, true);

    let result = label exit : Result.Result<ListingProposal, Error> {
      // Verify agent if agent canister is wired
      if (agentCanisterId != "") {
        let agentActor = actor(agentCanisterId) : actor {
          isVerifiedAgent : (Principal) -> async Bool;
        };
        let verified = await agentActor.isVerifiedAgent(msg.caller);
        if (not verified) break exit (#err(#NotAuthorized));
      };

      switch (Map.get(requests, Text.compare, requestId)) {
        case null    { break exit (#err(#NotFound)) };
        case (?req) {
          if (req.status != #Open)          break exit (#err(#InvalidInput("Request is not accepting proposals")));
          if (req.bidDeadline <= Time.now()) break exit (#err(#DeadlinePassed));
          let existingCount = Iter.size(Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool { p.requestId == requestId }));
          if (existingCount >= MAX_PROPOSALS_PER_REQUEST) break exit (#err(#InvalidInput("This listing has reached its maximum of 10 proposals")));
          let alreadyBid = Iter.size(Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool {
            p.requestId == requestId and p.agentId == msg.caller
          })) > 0;
          if (alreadyBid) break exit (#err(#InvalidInput("You have already submitted a proposal for this listing")));
          if (commissionBps == 0)           break exit (#err(#InvalidInput("commissionBps must be greater than 0")));
          if (estimatedSalePrice == 0)      break exit (#err(#InvalidInput("estimatedSalePrice must be greater than 0")));
          if (Text.size(agentName) == 0)    break exit (#err(#InvalidInput("agentName cannot be empty")));

          let id = nextProposalId();
          let proposal: ListingProposal = {
            id; requestId;
            agentId               = msg.caller;
            agentName; agentEmail; agentBrokerage; commissionBps; cmaSummary;
            marketingPlan; estimatedDaysOnMarket; estimatedSalePrice;
            includedServices; validUntil; coverLetter;
            status    = #Pending;
            createdAt = Time.now();
          };
          Map.add(proposals, Text.compare, id, proposal);
          #ok(proposal)
        };
      }
    };
    Map.remove(inFlightProposals, Text.compare, requestId);
    result
  };

  /// Agents may retract their own pending proposal before the bid deadline.
  public shared(msg) func withdrawProposal(proposalId: Text) : async Result.Result<(), Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };
    switch (Map.get(proposals, Text.compare, proposalId)) {
      case null { #err(#NotFound) };
      case (?p) {
        if (p.agentId != msg.caller)  return #err(#NotAuthorized);
        if (p.status != #Pending)      return #err(#InvalidInput("Only pending proposals can be withdrawn"));
        switch (Map.get(requests, Text.compare, p.requestId)) {
          case null { #err(#NotFound) };
          case (?req) {
            if (req.bidDeadline <= Time.now()) return #err(#DeadlinePassed);
            Map.add(proposals, Text.compare, proposalId, {
              id = p.id; requestId = p.requestId; agentId = p.agentId;
              agentName = p.agentName; agentEmail = p.agentEmail; agentBrokerage = p.agentBrokerage;
              commissionBps = p.commissionBps; cmaSummary = p.cmaSummary;
              marketingPlan = p.marketingPlan; estimatedDaysOnMarket = p.estimatedDaysOnMarket;
              estimatedSalePrice = p.estimatedSalePrice; includedServices = p.includedServices;
              validUntil = p.validUntil; coverLetter = p.coverLetter;
              status = #Withdrawn; createdAt = p.createdAt;
            });
            #ok(())
          }
        }
      }
    }
  };

  /// Vuln 3 fix: server-side deadline gate enforces the sealed-bid guarantee.
  /// - Before bidDeadline: homeowner and admin see all proposals; agents see only their own.
  /// - After bidDeadline: all authenticated callers see all proposals.
  public shared query(msg) func getProposalsForRequest(requestId: Text) : async [ListingProposal] {
    if (Principal.isAnonymous(msg.caller)) return [];
    let now = Time.now();
    let req = Map.get(requests, Text.compare, requestId);
    let deadlinePassed = switch (req) {
      case null    { true };
      case (?r)    { now >= r.bidDeadline };
    };
    let isOwner = switch (req) {
      case null    { false };
      case (?r)    { r.homeowner == msg.caller };
    };
    Iter.toArray(
      Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool {
        p.requestId == requestId and (
          deadlinePassed or isOwner or isAdmin(msg.caller) or p.agentId == msg.caller
        )
      })
    )
  };

  public query(msg) func getMyProposals() : async [ListingProposal] {
    Iter.toArray(
      Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool {
        p.agentId == msg.caller
      })
    )
  };

  // ─── Cascade Tick ────────────────────────────────────────────────────────────
  // Called by the Cloudflare Workers cron (hourly) via the admin identity.
  // Advances the payment cascade for any request whose deadline has passed
  // without feePaid = true. No heartbeat needed — cascade windows are 2–12 h.

  public shared(msg) func tickCascade() : async () {
    if (not isAdmin(msg.caller)) return;
    let now = Time.now();
    for ((requestId, state) in Map.entries(cascadeState)) {
      if (state.deadline > 0 and now >= state.deadline) {
        switch (Map.get(requests, Text.compare, requestId)) {
          case null {
            Map.add(cascadeState, Text.compare, requestId, { deadline = 0; backups = [] });
          };
          case (?req) {
            if (req.feePaid) {
              Map.add(cascadeState, Text.compare, requestId, { deadline = 0; backups = [] });
            } else {
              await advanceCascade(requestId, req, state);
            };
          };
        };
      };
    };
  };

  private func rejectCurrentWinner(requestId: Text) : () {
    for ((pid, p) in Map.entries(proposals)) {
      if (p.requestId == requestId and p.status == #Accepted) {
        Map.add(proposals, Text.compare, pid, {
          id = p.id; requestId = p.requestId; agentId = p.agentId;
          agentName = p.agentName; agentEmail = p.agentEmail; agentBrokerage = p.agentBrokerage;
          commissionBps = p.commissionBps; cmaSummary = p.cmaSummary;
          marketingPlan = p.marketingPlan; estimatedDaysOnMarket = p.estimatedDaysOnMarket;
          estimatedSalePrice = p.estimatedSalePrice; includedServices = p.includedServices;
          validUntil = p.validUntil; coverLetter = p.coverLetter;
          status = #Rejected; createdAt = p.createdAt;
        });
      };
    };
  };

  private func advanceCascade(requestId: Text, req: ListingBidRequest, state: CascadeState) : async () {
    if (state.backups.size() == 0) {
      // All backups exhausted without payment — reopen the listing and notify homeowner.
      Map.add(requests, Text.compare, requestId, {
        id = req.id; address = req.address; city = req.city;
        county = req.county; zipCode = req.zipCode;
        homeowner = req.homeowner; homeownerEmail = req.homeownerEmail;
        targetListDate = req.targetListDate; desiredSalePrice = req.desiredSalePrice;
        beds = req.beds; baths = req.baths; sqft = req.sqft;
        notes = req.notes; bidDeadline = req.bidDeadline;
        status = #Open; createdAt = req.createdAt; feePaid = false;
      });
      notificationCounter += 1;
      let nid = "NOTIF_" # Nat.toText(notificationCounter);
      Map.add(pendingNotifications, Text.compare, nid, {
        id = nid; requestId; createdAt = Time.now();
      });
      Map.add(cascadeState, Text.compare, requestId, { deadline = 0; backups = [] });
    } else {
      // Promote the next backup to #Accepted.
      let nextId   = state.backups[0];
      let remaining = Array.tabulate<Text>(state.backups.size() - 1, func(i) { state.backups[i + 1] });
      rejectCurrentWinner(requestId);
      switch (Map.get(proposals, Text.compare, nextId)) {
        case null {};
        case (?backup) {
          Map.add(proposals, Text.compare, nextId, {
            id = backup.id; requestId = backup.requestId; agentId = backup.agentId;
            agentName = backup.agentName; agentEmail = backup.agentEmail;
            agentBrokerage = backup.agentBrokerage; commissionBps = backup.commissionBps;
            cmaSummary = backup.cmaSummary; marketingPlan = backup.marketingPlan;
            estimatedDaysOnMarket = backup.estimatedDaysOnMarket;
            estimatedSalePrice = backup.estimatedSalePrice;
            includedServices = backup.includedServices; validUntil = backup.validUntil;
            coverLetter = backup.coverLetter; status = #Accepted; createdAt = backup.createdAt;
          });
          if (feeCanisterId != "") {
            let feeActor = actor(feeCanisterId) : actor {
              recordFeeOwed : (Text, Text, Principal, Principal, Nat) -> async ();
            };
            ignore feeActor.recordFeeOwed(requestId, nextId, backup.agentId, req.homeowner, platformFeeCents);
          };
        };
      };
      // Next window: 3 h if there is still a backup waiting, 2 h if this is the last.
      let nextWindowH : Int = if (remaining.size() > 0) { 3 } else { 2 };
      Map.add(cascadeState, Text.compare, requestId, {
        deadline = Time.now() + nextWindowH * HOURS_NS;
        backups  = remaining;
      });
    };
  };

  // ─── Accept a Proposal ───────────────────────────────────────────────────────

  /// Accept a proposal. `backups` is an ordered list of up to 2 proposal IDs for the
  /// same request that serve as cascade fallbacks (2nd and 3rd place). Passing [] is
  /// backwards-compatible and disables the cascade for this acceptance.
  public shared(msg) func acceptProposal(proposalId: Text, backups: [Text]) : async Result.Result<(), Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };

    switch (Map.get(proposals, Text.compare, proposalId)) {
      case null { #err(#NotFound) };
      case (?winner) {
        switch (Map.get(requests, Text.compare, winner.requestId)) {
          case null { #err(#NotFound) };
          case (?req) {
            if (req.homeowner != msg.caller) return #err(#NotAuthorized);
            if (req.status != #Open)         return #err(#InvalidInput("Request is no longer open"));

            // Accept winner
            Map.add(proposals, Text.compare, winner.id, {
              id = winner.id; requestId = winner.requestId;
              agentId = winner.agentId; agentName = winner.agentName; agentEmail = winner.agentEmail;
              agentBrokerage = winner.agentBrokerage; commissionBps = winner.commissionBps;
              cmaSummary = winner.cmaSummary; marketingPlan = winner.marketingPlan;
              estimatedDaysOnMarket = winner.estimatedDaysOnMarket;
              estimatedSalePrice = winner.estimatedSalePrice;
              includedServices = winner.includedServices; validUntil = winner.validUntil;
              coverLetter = winner.coverLetter; status = #Accepted; createdAt = winner.createdAt;
            });

            // Validate backups: must belong to this request, must not be the winner, max 2.
            if (backups.size() > 2) return #err(#InvalidInput("At most 2 backup proposals allowed"));
            for (bid in backups.vals()) {
              if (bid == winner.id) return #err(#InvalidInput("Winner cannot also be a backup"));
              switch (Map.get(proposals, Text.compare, bid)) {
                case null    { return #err(#NotFound) };
                case (?bp)   { if (bp.requestId != winner.requestId) return #err(#InvalidInput("Backup proposal belongs to a different request")) };
              };
            };

            // Mark backups as #Standby; reject all other pending proposals.
            let backupSet = backups;
            for ((pid, p) in Map.entries(proposals)) {
              if (p.requestId == winner.requestId and p.id != winner.id) {
                let isBackup = Option.isSome(Array.find<Text>(backupSet, func(b) { b == pid }));
                let newStatus : ProposalStatus = if (isBackup) { #Standby } else if (p.status == #Pending) { #Rejected } else { p.status };
                if (newStatus != p.status) {
                  Map.add(proposals, Text.compare, pid, {
                    id = p.id; requestId = p.requestId; agentId = p.agentId;
                    agentName = p.agentName; agentEmail = p.agentEmail; agentBrokerage = p.agentBrokerage;
                    commissionBps = p.commissionBps; cmaSummary = p.cmaSummary;
                    marketingPlan = p.marketingPlan;
                    estimatedDaysOnMarket = p.estimatedDaysOnMarket;
                    estimatedSalePrice = p.estimatedSalePrice;
                    includedServices = p.includedServices; validUntil = p.validUntil;
                    coverLetter = p.coverLetter; status = newStatus; createdAt = p.createdAt;
                  });
                };
              };
            };

            // Award the request
            Map.add(requests, Text.compare, req.id, {
              id = req.id; address = req.address; city = req.city;
              county = req.county; zipCode = req.zipCode;
              homeowner = req.homeowner; homeownerEmail = req.homeownerEmail;
              targetListDate = req.targetListDate;
              desiredSalePrice = req.desiredSalePrice;
              beds = req.beds; baths = req.baths; sqft = req.sqft;
              notes = req.notes;
              bidDeadline = req.bidDeadline; status = #Awarded; createdAt = req.createdAt;
              feePaid = false;
            });

            // Record platform fee in the fee canister (fire-and-forget — don't block on failure)
            if (feeCanisterId != "") {
              let feeActor = actor(feeCanisterId) : actor {
                recordFeeOwed : (Text, Text, Principal, Principal, Nat) -> async ();
              };
              ignore feeActor.recordFeeOwed(
                req.id, winner.id, winner.agentId, req.homeowner, platformFeeCents
              );
            };

            // Start cascade: winner has 12 h to pay before backups are offered.
            if (backups.size() > 0) {
              Map.add(cascadeState, Text.compare, req.id, {
                deadline = Time.now() + 12 * HOURS_NS;
                backups  = backups;
              });
            };

            #ok(())
          };
        }
      };
    }
  };

  // ─── Cross-canister Helper ────────────────────────────────────────────────────

  /// Vuln 5: Called by the agent canister to verify a review transaction.
  /// Returns true iff proposalId is an #Accepted proposal for agentId where reviewer is the homeowner.
  public query func validateReviewTransaction(
    proposalId: Text,
    reviewer:   Principal,
    agentId:    Principal
  ) : async Bool {
    switch (Map.get(proposals, Text.compare, proposalId)) {
      case null { false };
      case (?p) {
        if (p.status != #Accepted) return false;
        if (p.agentId != agentId)  return false;
        switch (Map.get(requests, Text.compare, p.requestId)) {
          case null  { false };
          case (?req){ req.homeowner == reviewer };
        }
      };
    }
  };

  // ─── Fee Payment Gate ─────────────────────────────────────────────────────────

  private func isFeeCanister(caller: Principal) : Bool {
    feeCanisterId != "" and Principal.toText(caller) == feeCanisterId
  };

  /// Called by the fee canister after a winning agent's Stripe payment is confirmed.
  /// Flips feePaid = true, which is the gate that allows getBidRequest to return the address.
  public shared(msg) func markListingFeePaid(requestId: Text) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller) and not isFeeCanister(msg.caller)) return #err(#NotAuthorized);
    switch (Map.get(requests, Text.compare, requestId)) {
      case null { #err(#NotFound) };
      case (?req) {
        Map.add(requests, Text.compare, requestId, {
          id = req.id; address = req.address; city = req.city;
          county = req.county; zipCode = req.zipCode;
          homeowner = req.homeowner; homeownerEmail = req.homeownerEmail;
          targetListDate = req.targetListDate;
          desiredSalePrice = req.desiredSalePrice;
          beds = req.beds; baths = req.baths; sqft = req.sqft;
          notes = req.notes;
          bidDeadline = req.bidDeadline; status = req.status; createdAt = req.createdAt;
          feePaid = true;
        });
        // Deactivate cascade — payment confirmed.
        Map.add(cascadeState, Text.compare, requestId, { deadline = 0; backups = [] });
        #ok(())
      };
    }
  };

  // ─── Cascade Notifications ───────────────────────────────────────────────────

  /// Email server polls this (using its admin identity) to find requests where all
  /// backup agents failed to pay. Returns all pending notifications.
  public shared(msg) func getPendingNotifications() : async [PendingNotification] {
    if (not isAdmin(msg.caller)) return [];
    Iter.toArray(Map.values(pendingNotifications))
  };

  /// Called by the email server after it has sent the notification email.
  public shared(msg) func clearNotification(id: Text) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    Map.remove(pendingNotifications, Text.compare, id);
    #ok(())
  };

  // ─── Admin Controls ───────────────────────────────────────────────────────────

  public shared(msg) func setFeeCanisterId(id: Text) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    feeCanisterId := id;
    #ok(())
  };

  public shared(msg) func setAgentCanisterId(id: Text) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    agentCanisterId := id;
    #ok(())
  };

  public shared(msg) func setPlatformFee(cents: Nat) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    platformFeeCents := cents;
    #ok(())
  };

  public shared(msg) func setUpdateRateLimit(n: Nat) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    maxUpdatesPerMin := n;
    #ok(())
  };

  /// Vuln 1: Admin explicitly enables the homeowner verification gate after first homeowners are set up.
  public shared(msg) func enableVerification() : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    verificationEnabled := true;
    #ok(())
  };

  /// Vuln 2 fix: first call is restricted to the canister's controller (the deploying identity).
  /// Once adminInitialized is true only existing admins may add further admins.
  public shared(msg) func addAdmin(newAdmin: Principal) : async Result.Result<(), Error> {
    if (adminInitialized) {
      if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    } else {
      if (not Principal.isController(msg.caller)) return #err(#NotAuthorized);
    };
    if (not isAdmin(newAdmin)) {
      adminListEntries := Array.concat(adminListEntries, [newAdmin]);
    };
    adminInitialized := true;
    #ok(())
  };

  public shared(msg) func removeAdmin(target: Principal) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    adminListEntries := Array.filter<Principal>(adminListEntries, func(a) { a != target });
    #ok(())
  };

  public shared(msg) func pause(durationSeconds: ?Nat) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    isPaused := true;
    pauseExpiryNs := switch (durationSeconds) {
      case null    { null };
      case (?secs) { ?(Time.now() + secs * 1_000_000_000) };
    };
    #ok(())
  };

  public shared(msg) func unpause() : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    isPaused := false;
    pauseExpiryNs := null;
    #ok(())
  };

  public shared(msg) func requestHomeownerVerification(
    address: Text, parcelNumber: Text, contactEmail: Text
  ) : async Result.Result<HomeownerVerificationRequest, Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };
    let id = nextVerificationId();
    let req: HomeownerVerificationRequest = {
      id; principal = msg.caller; address; parcelNumber; contactEmail;
      submittedAt = Time.now();
    };
    Map.add(verificationRequests, Text.compare, id, req);
    #ok(req)
  };

  /// Upload a verification document blob for an existing request.
  /// Only the principal who submitted the request may upload docs for it.
  /// Max 800 KB per document.
  public shared(msg) func uploadVerificationDoc(
    requestId : Text,
    docType   : DocType,
    blob      : Blob
  ) : async Result.Result<Text, Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };
    if (blob.size() > 819_200) return #err(#InvalidInput("Document must be under 800 KB"));
    switch (Map.get(verificationRequests, Text.compare, requestId)) {
      case null    { #err(#NotFound) };
      case (?req) {
        if (req.principal != msg.caller) return #err(#NotAuthorized);
        let docId = nextDocId();
        Map.add(verificationDocs, Text.compare, docId, {
          id = docId; requestId; principal = msg.caller;
          docType; blob; uploadedAt = Time.now();
        });
        #ok(docId)
      };
    }
  };

  /// Admin-only: retrieve all documents attached to a verification request.
  public query(msg) func getVerificationDocs(requestId : Text) : async [VerificationDoc] {
    if (not isAdmin(msg.caller)) return [];
    Iter.toArray(
      Iter.filter(Map.values(verificationDocs), func(d : VerificationDoc) : Bool {
        d.requestId == requestId
      })
    )
  };

  public shared(msg) func verifyHomeowner(principal: Principal) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    Map.add(verifiedHomeowners, Principal.compare, principal, true);
    #ok(())
  };

  public shared(msg) func revokeHomeowner(principal: Principal) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    Map.add(verifiedHomeowners, Principal.compare, principal, false);
    #ok(())
  };

  public query(msg) func isHomeownerVerified() : async Bool {
    switch (Map.get(verifiedHomeowners, Principal.compare, msg.caller)) {
      case null { false };
      case (?v) { v };
    }
  };

  public query(msg) func getPendingVerificationRequests() : async [HomeownerVerificationRequest] {
    if (not isAdmin(msg.caller)) return [];
    Iter.toArray(Map.values(verificationRequests))
  };

  public query func metrics() : async Metrics {
    var open = 0; var awarded = 0; var expired = 0;
    for (r in Map.values(requests)) {
      if (r.status == #Open)    { open    += 1 };
      if (r.status == #Awarded) { awarded += 1 };
      if (r.status == #Expired) { expired += 1 };
    };
    { totalRequests = Map.size(requests); openRequests = open;
      awardedRequests = awarded; expiredRequests = expired;
      totalProposals = Map.size(proposals); isPaused }
  };
}
