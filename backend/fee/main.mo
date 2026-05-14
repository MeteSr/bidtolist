/**
 * BidtoList Fee Canister
 *
 * Tracks platform fees owed by winning agents.
 * Revenue model: $295 flat fee per accepted bid.
 *
 * recordFeeOwed is called by the listing canister on acceptProposal.
 * Admin marks fees Invoiced → Paid (or Waived) after Stripe payment is confirmed.
 */

import Array     "mo:core/Array";
import Map       "mo:core/Map";
import Iter      "mo:core/Iter";
import Nat       "mo:core/Nat";
import Option    "mo:core/Option";
import Principal "mo:core/Principal";
import Result    "mo:core/Result";
import Text      "mo:core/Text";
import Time      "mo:core/Time";

persistent actor Fee {

  // ─── Types ──────────────────────────────────────────────────────────────────

  public type FeeStatus = { #Owed; #Invoiced; #Paid; #Waived };

  public type FeeRecord = {
    id:           Text;
    requestId:    Text;
    proposalId:   Text;
    agentId:      Principal;
    homeownerId:  Principal;
    amountCents:  Nat;
    status:       FeeStatus;
    createdAt:    Int;
    updatedAt:    Int;
  };

  public type Error = {
    #NotFound;
    #NotAuthorized;
    #InvalidInput: Text;
  };

  public type Metrics = {
    totalFees:    Nat;
    totalOwed:    Nat;     // count of #Owed records
    totalPaid:    Nat;     // count of #Paid records
    revenueUSD:   Nat;     // sum of amountCents for #Paid records / 100
    isPaused:     Bool;
  };

  // ─── Stable State ─────────────────────────────────────────────────────────────

  private var feeCounter:       Nat         = 0;
  private var isPaused:         Bool        = false;
  private var adminListEntries: [Principal] = [];
  private var adminInitialized: Bool        = false;
  private var listingCanisterId: Text       = "";

  private let fees = Map.empty<Text, FeeRecord>();

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private func isAdmin(p: Principal) : Bool {
    Option.isSome(Array.find<Principal>(adminListEntries, func(a) { a == p }))
  };

  private func isListingCanister(caller: Principal) : Bool {
    listingCanisterId != "" and Principal.toText(caller) == listingCanisterId
  };

  private func nextFeeId() : Text {
    feeCounter += 1;
    "FEE_" # Nat.toText(feeCounter)
  };

  // ─── Fee Recording ────────────────────────────────────────────────────────────

  /// Called by the listing canister when a proposal is accepted.
  /// Only the wired listing canister or an admin may call this.
  public shared(msg) func recordFeeOwed(
    requestId:   Text,
    proposalId:  Text,
    agentId:     Principal,
    homeownerId: Principal,
    amountCents: Nat
  ) : async () {
    if (isPaused) return;
    if (not isListingCanister(msg.caller) and not isAdmin(msg.caller)) return;

    let id  = nextFeeId();
    let now = Time.now();
    let fee: FeeRecord = {
      id; requestId; proposalId; agentId; homeownerId; amountCents;
      status = #Owed; createdAt = now; updatedAt = now;
    };
    Map.add(fees, Text.compare, id, fee);
  };

  // ─── Queries ─────────────────────────────────────────────────────────────────

  /// Agent views their own fee records.
  public query(msg) func getMyFees() : async [FeeRecord] {
    Iter.toArray(
      Iter.filter(Map.values(fees), func(f: FeeRecord) : Bool {
        f.agentId == msg.caller
      })
    )
  };

  /// Admin: all fee records.
  public query(msg) func getAllFees() : async Result.Result<[FeeRecord], Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    #ok(Iter.toArray(Map.values(fees)))
  };

  /// Admin: fees with status #Owed.
  public query(msg) func getFeesDue() : async Result.Result<[FeeRecord], Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    #ok(Iter.toArray(
      Iter.filter(Map.values(fees), func(f: FeeRecord) : Bool { f.status == #Owed })
    ))
  };

  // ─── Status Transitions (admin) ───────────────────────────────────────────────

  private func updateFeeStatus(caller: Principal, feeId: Text, newStatus: FeeStatus)
    : Result.Result<FeeRecord, Error> {
    if (not isAdmin(caller)) return #err(#NotAuthorized);
    switch (Map.get(fees, Text.compare, feeId)) {
      case null { #err(#NotFound) };
      case (?f) {
        let updated: FeeRecord = {
          id = f.id; requestId = f.requestId; proposalId = f.proposalId;
          agentId = f.agentId; homeownerId = f.homeownerId; amountCents = f.amountCents;
          status = newStatus; createdAt = f.createdAt; updatedAt = Time.now();
        };
        Map.add(fees, Text.compare, feeId, updated);
        #ok(updated)
      };
    }
  };

  public shared(msg) func markFeeInvoiced(feeId: Text) : async Result.Result<FeeRecord, Error> {
    updateFeeStatus(msg.caller, feeId, #Invoiced)
  };

  public shared(msg) func markFeePaid(feeId: Text) : async Result.Result<FeeRecord, Error> {
    updateFeeStatus(msg.caller, feeId, #Paid)
  };

  public shared(msg) func waiveFee(feeId: Text) : async Result.Result<FeeRecord, Error> {
    updateFeeStatus(msg.caller, feeId, #Waived)
  };

  // ─── Admin Controls ───────────────────────────────────────────────────────────

  public shared(msg) func setListingCanisterId(id: Text) : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    listingCanisterId := id;
    #ok(())
  };

  /// Vuln 2 fix: first call restricted to the canister's controller; subsequent calls require an existing admin.
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
    #ok(())
  };

  public shared(msg) func unpause() : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    isPaused := false;
    #ok(())
  };

  public query func metrics() : async Metrics {
    var owed = 0; var paid = 0; var paidCents = 0;
    for (f in Map.values(fees)) {
      if (f.status == #Owed)  { owed += 1 };
      if (f.status == #Paid)  { paid += 1; paidCents += f.amountCents };
    };
    { totalFees = Map.size(fees); totalOwed = owed;
      totalPaid = paid; revenueUSD = paidCents / 100; isPaused }
  };
}
