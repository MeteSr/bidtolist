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

  public type BidRequestStatus = { #Open; #Awarded; #Cancelled };
  public type ProposalStatus   = { #Pending; #Accepted; #Rejected; #Withdrawn };

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

  public type BidRequestSummary = {
    id:               Text;
    city:             Text;
    county:           Text;
    zipCode:          Text;
    targetListDate:   Time.Time;
    desiredSalePrice: ?Nat;
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
    county:           Text;    // "Volusia" | "Flagler"
    zipCode:          Text;
    homeowner:        Principal;
    homeownerEmail:   Text;
    targetListDate:   Time.Time;
    desiredSalePrice: ?Nat;
    notes:            Text;
    bidDeadline:      Time.Time;
    status:           BidRequestStatus;
    createdAt:        Time.Time;
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
    totalRequests:   Nat;
    openRequests:    Nat;
    awardedRequests: Nat;
    totalProposals:  Nat;
    isPaused:        Bool;
  };

  // ─── Stable State ────────────────────────────────────────────────────────────

  private let MAX_PROPOSALS_PER_REQUEST : Nat = 10;

  private var bidCounter:      Nat = 0;
  private var proposalCounter: Nat = 0;
  private var isPaused:        Bool = false;
  private var pauseExpiryNs:   ?Int = null;
  private var adminListEntries: [Principal] = [];
  private var adminInitialized: Bool = false;
  private var feeCanisterId:   Text = "";
  private var platformFeeCents: Nat = 29500; // $295.00 default
  private var agentCanisterId: Text = "";

  private let requests  = Map.empty<Text, ListingBidRequest>();
  private let proposals = Map.empty<Text, ListingProposal>();
  private let verifiedHomeowners = Map.empty<Principal, Bool>();
  private let verificationRequests = Map.empty<Text, HomeownerVerificationRequest>();
  private var verificationCounter: Nat = 0;

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

  // ─── Homeowner: Bid Request Lifecycle ────────────────────────────────────────

  public shared(msg) func createBidRequest(
    address:          Text,
    city:             Text,
    county:           Text,
    zipCode:          Text,
    targetListDate:   Int,
    desiredSalePrice: ?Nat,
    notes:            Text,
    bidDeadline:      Int,
    homeownerEmail:   Text
  ) : async Result.Result<ListingBidRequest, Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };

    // Homeowner must be verified (if verification has been used — skip if map is empty so dev mode works without admin)
    if (Map.size(verifiedHomeowners) > 0) {
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
      notes;
      bidDeadline;
      status           = #Open;
      createdAt        = Time.now();
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

  public query func getBidRequest(id: Text) : async Result.Result<ListingBidRequest, Error> {
    switch (Map.get(requests, Text.compare, id)) {
      case null { #err(#NotFound) };
      case (?r) { #ok(r) };
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
          homeowner = req.homeowner; targetListDate = req.targetListDate;
          desiredSalePrice = req.desiredSalePrice; notes = req.notes;
          bidDeadline = req.bidDeadline; status = #Cancelled; createdAt = req.createdAt;
        });
        #ok(())
      };
    }
  };

  /// Public — agents browse open bid requests (summary view, address omitted for privacy).
  public query func getOpenBidRequests() : async [BidRequestSummary] {
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
        notes            = r.notes;
        bidDeadline      = r.bidDeadline;
        status           = r.status;
        createdAt        = r.createdAt;
        proposalCount    = count;
      }
    }))
  };

  // ─── Agent: Proposal Lifecycle ────────────────────────────────────────────────

  /// Submit a proposal. Sealed until bidDeadline — the frontend enforces the reveal gate.
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

    // Verify agent if agent canister is wired
    if (agentCanisterId != "") {
      let agentActor = actor(agentCanisterId) : actor {
        isVerifiedAgent : (Principal) -> async Bool;
      };
      let verified = await agentActor.isVerifiedAgent(msg.caller);
      if (not verified) return #err(#NotAuthorized);
    };

    switch (Map.get(requests, Text.compare, requestId)) {
      case null    { #err(#NotFound) };
      case (?req) {
        if (req.status != #Open)          return #err(#InvalidInput("Request is not accepting proposals"));
        if (req.bidDeadline <= Time.now()) return #err(#DeadlinePassed);
        let existingCount = Iter.size(Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool { p.requestId == requestId }));
        if (existingCount >= MAX_PROPOSALS_PER_REQUEST) return #err(#InvalidInput("This listing has reached its maximum of 10 proposals"));
        if (commissionBps == 0)           return #err(#InvalidInput("commissionBps must be greater than 0"));
        if (estimatedSalePrice == 0)      return #err(#InvalidInput("estimatedSalePrice must be greater than 0"));
        if (Text.size(agentName) == 0)    return #err(#InvalidInput("agentName cannot be empty"));

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

  public query func getProposalsForRequest(requestId: Text) : async [ListingProposal] {
    Iter.toArray(
      Iter.filter(Map.values(proposals), func(p: ListingProposal) : Bool {
        p.requestId == requestId
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

  // ─── Accept a Proposal ───────────────────────────────────────────────────────

  /// Accept a proposal: marks winner Accepted, rejects all others, awards the request,
  /// and records a platform fee in the fee canister.
  public shared(msg) func acceptProposal(proposalId: Text) : async Result.Result<(), Error> {
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

            // Reject all other pending proposals on this request
            for ((pid, p) in Map.entries(proposals)) {
              if (p.requestId == winner.requestId and p.id != winner.id and p.status == #Pending) {
                Map.add(proposals, Text.compare, pid, {
                  id = p.id; requestId = p.requestId; agentId = p.agentId;
                  agentName = p.agentName; agentEmail = p.agentEmail; agentBrokerage = p.agentBrokerage;
                  commissionBps = p.commissionBps; cmaSummary = p.cmaSummary;
                  marketingPlan = p.marketingPlan;
                  estimatedDaysOnMarket = p.estimatedDaysOnMarket;
                  estimatedSalePrice = p.estimatedSalePrice;
                  includedServices = p.includedServices; validUntil = p.validUntil;
                  coverLetter = p.coverLetter; status = #Rejected; createdAt = p.createdAt;
                });
              };
            };

            // Award the request
            Map.add(requests, Text.compare, req.id, {
              id = req.id; address = req.address; city = req.city;
              county = req.county; zipCode = req.zipCode;
              homeowner = req.homeowner; targetListDate = req.targetListDate;
              desiredSalePrice = req.desiredSalePrice; notes = req.notes;
              bidDeadline = req.bidDeadline; status = #Awarded; createdAt = req.createdAt;
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

            #ok(())
          };
        }
      };
    }
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

  public shared(msg) func addAdmin(newAdmin: Principal) : async Result.Result<(), Error> {
    if (adminInitialized and not isAdmin(msg.caller)) return #err(#NotAuthorized);
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
    var open = 0; var awarded = 0;
    for (r in Map.values(requests)) {
      if (r.status == #Open)    { open    += 1 };
      if (r.status == #Awarded) { awarded += 1 };
    };
    { totalRequests = Map.size(requests); openRequests = open;
      awardedRequests = awarded; totalProposals = Map.size(proposals); isPaused }
  };
}
