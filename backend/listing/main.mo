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

  public type ListingBidRequest = {
    id:               Text;
    address:          Text;
    city:             Text;
    county:           Text;    // "Volusia" | "Flagler"
    zipCode:          Text;
    homeowner:        Principal;
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

  private var bidCounter:      Nat = 0;
  private var proposalCounter: Nat = 0;
  private var isPaused:        Bool = false;
  private var pauseExpiryNs:   ?Int = null;
  private var adminListEntries: [Principal] = [];
  private var adminInitialized: Bool = false;
  private var feeCanisterId:   Text = "";
  private var platformFeeCents: Nat = 29500; // $295.00 default

  private let requests  = Map.empty<Text, ListingBidRequest>();
  private let proposals = Map.empty<Text, ListingProposal>();

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

  // ─── Homeowner: Bid Request Lifecycle ────────────────────────────────────────

  public shared(msg) func createBidRequest(
    address:          Text,
    city:             Text,
    county:           Text,
    zipCode:          Text,
    targetListDate:   Int,
    desiredSalePrice: ?Nat,
    notes:            Text,
    bidDeadline:      Int
  ) : async Result.Result<ListingBidRequest, Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };

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

  /// Public — agents browse open bid requests by county.
  public query func getOpenBidRequests() : async [ListingBidRequest] {
    Iter.toArray(
      Iter.filter(Map.values(requests), func(r: ListingBidRequest) : Bool {
        r.status == #Open
      })
    )
  };

  // ─── Agent: Proposal Lifecycle ────────────────────────────────────────────────

  /// Submit a proposal. Sealed until bidDeadline — the frontend enforces the reveal gate.
  public shared(msg) func submitProposal(
    requestId:             Text,
    agentName:             Text,
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

    switch (Map.get(requests, Text.compare, requestId)) {
      case null    { #err(#NotFound) };
      case (?req) {
        if (req.status != #Open)          return #err(#InvalidInput("Request is not accepting proposals"));
        if (req.bidDeadline <= Time.now()) return #err(#DeadlinePassed);
        if (commissionBps == 0)           return #err(#InvalidInput("commissionBps must be greater than 0"));
        if (estimatedSalePrice == 0)      return #err(#InvalidInput("estimatedSalePrice must be greater than 0"));
        if (Text.size(agentName) == 0)    return #err(#InvalidInput("agentName cannot be empty"));

        let id = nextProposalId();
        let proposal: ListingProposal = {
          id; requestId;
          agentId               = msg.caller;
          agentName; agentBrokerage; commissionBps; cmaSummary;
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
              agentId = winner.agentId; agentName = winner.agentName;
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
                  agentName = p.agentName; agentBrokerage = p.agentBrokerage;
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
