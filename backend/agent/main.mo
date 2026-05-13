/**
 * BidtoList Agent Canister
 *
 * On-chain profile for licensed real estate agents.
 * Lifted from HomeGentic's agent canister; added county field for Volusia/Flagler targeting.
 */

import Array     "mo:core/Array";
import Map       "mo:core/Map";
import Int       "mo:core/Int";
import Iter      "mo:core/Iter";
import Nat       "mo:core/Nat";
import Option    "mo:core/Option";
import Principal "mo:core/Principal";
import Result    "mo:core/Result";
import Text      "mo:core/Text";
import Time      "mo:core/Time";

persistent actor Agent {

  // ─── Types ──────────────────────────────────────────────────────────────────

  public type AgentProfile = {
    id:                   Principal;
    name:                 Text;
    brokerage:            Text;
    licenseNumber:        Text;
    statesLicensed:       [Text];
    county:               Text;   // "Volusia" | "Flagler" | "Both"
    bio:                  Text;
    phone:                Text;
    email:                Text;
    avgDaysOnMarket:      Nat;
    listingsLast12Months: Nat;
    isVerified:           Bool;
    createdAt:            Int;
    updatedAt:            Int;
  };

  public type RegisterArgs = {
    name:           Text;
    brokerage:      Text;
    licenseNumber:  Text;
    statesLicensed: [Text];
    county:         Text;
    bio:            Text;
    phone:          Text;
    email:          Text;
  };

  public type UpdateArgs = {
    name:           Text;
    brokerage:      Text;
    licenseNumber:  Text;
    statesLicensed: [Text];
    county:         Text;
    bio:            Text;
    phone:          Text;
    email:          Text;
  };

  public type AgentReview = {
    id:                Text;
    agentId:           Principal;
    reviewerPrincipal: Principal;
    rating:            Nat;   // 1–5
    comment:           Text;
    transactionId:     Text;  // proposalId of the won bid
    createdAt:         Int;
  };

  public type AddReviewArgs = {
    agentId:       Principal;
    rating:        Nat;
    comment:       Text;
    transactionId: Text;
  };

  public type Error = {
    #NotFound;
    #AlreadyExists;
    #NotAuthorized;
    #Paused;
    #RateLimitExceeded;
    #DuplicateReview;
    #InvalidInput: Text;
  };

  public type Metrics = {
    totalAgents:    Nat;
    verifiedAgents: Nat;
    totalReviews:   Nat;
    isPaused:       Bool;
  };

  // ─── Stable State ─────────────────────────────────────────────────────────────

  private var isPaused:         Bool        = false;
  private var pauseExpiryNs:    ?Int        = null;
  private var adminListEntries: [Principal] = [];
  private var adminInitialized: Bool        = false;
  private var reviewCounter:    Nat         = 0;

  private let agents           = Map.empty<Principal, AgentProfile>();
  private let reviews          = Map.empty<Text, AgentReview>();
  private let reviewKeys       = Map.empty<Text, Text>();
  private let reviewRateLimits = Map.empty<Text, (Nat, Int)>();

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

  private func isAdmin(p: Principal) : Bool {
    Option.isSome(Array.find<Principal>(adminListEntries, func(a) { a == p }))
  };

  private func requireActive(caller: Principal) : Result.Result<(), Error> {
    if (Principal.isAnonymous(caller)) return #err(#NotAuthorized);
    if (isPaused) {
      switch (pauseExpiryNs) {
        case (?expiry) { if (Time.now() < expiry) return #err(#Paused) };
        case null { return #err(#Paused) };
      };
    };
    if (not tryConsumeUpdateSlot(caller)) return #err(#RateLimitExceeded);
    #ok(())
  };

  private let oneDayNs       : Int = 24 * 60 * 60 * 1_000_000_000;
  private let dailyReviewLimit : Nat = 10;

  private func tryConsumeReviewSlot(reviewer: Principal) : Bool {
    let key = Principal.toText(reviewer);
    let now = Time.now();
    switch (Map.get(reviewRateLimits, Text.compare, key)) {
      case null { Map.add(reviewRateLimits, Text.compare, key, (1, now)); true };
      case (?(count, windowStart)) {
        if (now - windowStart >= oneDayNs) { Map.add(reviewRateLimits, Text.compare, key, (1, now)); true }
        else if (count < dailyReviewLimit) { Map.add(reviewRateLimits, Text.compare, key, (count + 1, windowStart)); true }
        else { false }
      };
    }
  };

  // ─── Agent Profile Lifecycle ──────────────────────────────────────────────────

  public shared(msg) func register(args: RegisterArgs) : async Result.Result<AgentProfile, Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };
    if (Map.get(agents, Principal.compare, msg.caller) != null) return #err(#AlreadyExists);
    if (Text.size(args.name)          == 0)   return #err(#InvalidInput("name cannot be empty"));
    if (Text.size(args.brokerage)     == 0)   return #err(#InvalidInput("brokerage cannot be empty"));
    if (Text.size(args.licenseNumber) == 0)   return #err(#InvalidInput("licenseNumber cannot be empty"));
    if (Text.size(args.email)          > 256) return #err(#InvalidInput("email too long"));
    if (Text.size(args.bio)            > 2000) return #err(#InvalidInput("bio exceeds 2000 characters"));

    let now = Time.now();
    let profile: AgentProfile = {
      id                   = msg.caller;
      name                 = args.name;
      brokerage            = args.brokerage;
      licenseNumber        = args.licenseNumber;
      statesLicensed       = args.statesLicensed;
      county               = args.county;
      bio                  = args.bio;
      phone                = args.phone;
      email                = args.email;
      avgDaysOnMarket      = 0;
      listingsLast12Months = 0;
      isVerified           = false;
      createdAt            = now;
      updatedAt            = now;
    };
    Map.add(agents, Principal.compare, msg.caller, profile);
    #ok(profile)
  };

  public query(msg) func getMyProfile() : async ?AgentProfile {
    Map.get(agents, Principal.compare, msg.caller)
  };

  public query func getProfile(agentId: Principal) : async ?AgentProfile {
    Map.get(agents, Principal.compare, agentId)
  };

  public query func getAllProfiles() : async [AgentProfile] {
    Iter.toArray(Map.values(agents))
  };

  /// Filter agents by county ("Volusia" | "Flagler" | "Both" matches either).
  public query func getProfilesByCounty(county: Text) : async [AgentProfile] {
    Iter.toArray(
      Iter.filter(Map.values(agents), func(a: AgentProfile) : Bool {
        a.county == county or a.county == "Both"
      })
    )
  };

  public shared(msg) func updateProfile(args: UpdateArgs) : async Result.Result<AgentProfile, Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };
    switch (Map.get(agents, Principal.compare, msg.caller)) {
      case null { #err(#NotFound) };
      case (?existing) {
        if (Text.size(args.name)          == 0) return #err(#InvalidInput("name cannot be empty"));
        if (Text.size(args.brokerage)     == 0) return #err(#InvalidInput("brokerage cannot be empty"));
        if (Text.size(args.licenseNumber) == 0) return #err(#InvalidInput("licenseNumber cannot be empty"));
        if (Text.size(args.bio)           > 2000) return #err(#InvalidInput("bio exceeds 2000 characters"));
        let updated: AgentProfile = {
          id = existing.id; name = args.name; brokerage = args.brokerage;
          licenseNumber = args.licenseNumber; statesLicensed = args.statesLicensed;
          county = args.county; bio = args.bio; phone = args.phone; email = args.email;
          avgDaysOnMarket = existing.avgDaysOnMarket;
          listingsLast12Months = existing.listingsLast12Months;
          isVerified = existing.isVerified;
          createdAt = existing.createdAt; updatedAt = Time.now();
        };
        Map.add(agents, Principal.compare, msg.caller, updated);
        #ok(updated)
      };
    }
  };

  // ─── Reviews ──────────────────────────────────────────────────────────────────

  public shared(msg) func addReview(args: AddReviewArgs) : async Result.Result<AgentReview, Error> {
    switch (requireActive(msg.caller)) { case (#err(e)) return #err(e); case _ {} };
    if (Map.get(agents, Principal.compare, args.agentId) == null) return #err(#NotFound);
    if (args.rating < 1 or args.rating > 5) return #err(#InvalidInput("rating must be 1–5"));
    if (Text.size(args.transactionId) == 0) return #err(#InvalidInput("transactionId cannot be empty"));

    let compositeKey = Principal.toText(msg.caller) # "|" # args.transactionId;
    if (Map.get(reviewKeys, Text.compare, compositeKey) != null) return #err(#DuplicateReview);
    if (not tryConsumeReviewSlot(msg.caller)) return #err(#RateLimitExceeded);

    reviewCounter += 1;
    let id = "AGREV_" # Nat.toText(reviewCounter);
    let review: AgentReview = {
      id; agentId = args.agentId; reviewerPrincipal = msg.caller;
      rating = args.rating; comment = args.comment;
      transactionId = args.transactionId; createdAt = Time.now();
    };
    Map.add(reviews, Text.compare, id, review);
    Map.add(reviewKeys, Text.compare, compositeKey, id);
    #ok(review)
  };

  public query func getReviews(agentId: Principal) : async [AgentReview] {
    Iter.toArray(
      Iter.filter(Map.values(reviews), func(r: AgentReview) : Bool { r.agentId == agentId })
    )
  };

  // ─── Admin ────────────────────────────────────────────────────────────────────

  public shared(msg) func verifyAgent(agentId: Principal) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    switch (Map.get(agents, Principal.compare, agentId)) {
      case null { #err(#NotFound) };
      case (?existing) {
        Map.add(agents, Principal.compare, agentId, {
          id = existing.id; name = existing.name; brokerage = existing.brokerage;
          licenseNumber = existing.licenseNumber; statesLicensed = existing.statesLicensed;
          county = existing.county; bio = existing.bio; phone = existing.phone;
          email = existing.email; avgDaysOnMarket = existing.avgDaysOnMarket;
          listingsLast12Months = existing.listingsLast12Months; isVerified = true;
          createdAt = existing.createdAt; updatedAt = Time.now();
        });
        #ok(())
      };
    }
  };

  public shared(msg) func recordListingClose(agentId: Principal, daysOnMarket: Nat) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    switch (Map.get(agents, Principal.compare, agentId)) {
      case null { #err(#NotFound) };
      case (?existing) {
        let newListings = existing.listingsLast12Months + 1;
        let newAvg = (existing.avgDaysOnMarket * existing.listingsLast12Months + daysOnMarket) / newListings;
        Map.add(agents, Principal.compare, agentId, {
          id = existing.id; name = existing.name; brokerage = existing.brokerage;
          licenseNumber = existing.licenseNumber; statesLicensed = existing.statesLicensed;
          county = existing.county; bio = existing.bio; phone = existing.phone;
          email = existing.email; avgDaysOnMarket = newAvg;
          listingsLast12Months = newListings; isVerified = existing.isVerified;
          createdAt = existing.createdAt; updatedAt = Time.now();
        });
        #ok(())
      };
    }
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
      case null { null };
      case (?secs) { ?(Time.now() + secs * 1_000_000_000) };
    };
    #ok(())
  };

  public shared(msg) func unpause() : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    isPaused := false; pauseExpiryNs := null;
    #ok(())
  };

  public query func isVerifiedAgent(principal: Principal) : async Bool {
    switch (Map.get(agents, Principal.compare, principal)) {
      case null { false };
      case (?p) { p.isVerified };
    }
  };

  public query func metrics() : async Metrics {
    var verified = 0;
    for (a in Map.values(agents)) { if (a.isVerified) { verified += 1 } };
    { totalAgents = Map.size(agents); verifiedAgents = verified;
      totalReviews = Map.size(reviews); isPaused }
  };
}
