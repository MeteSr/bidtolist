import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createBidRequest,
  getMyBidRequests,
  getBidRequest,
  getOpenBidRequests,
  getOpenBidRequestsForCities,
  submitProposal,
  getProposalsForRequest,
  getMyProposals,
  cancelBidRequest,
  markRevealNotified,
  withdrawProposal,
  expireStaleListings,
  getListingMetrics,
} from "../../services/listing";

// LISTING_CANISTER_ID is "" in test mode (vite.config.ts mode==="test") — all mock paths run.

function clearMocks() {
  delete (window as any).__e2e_requests;
  delete (window as any).__e2e_proposals;
}

beforeEach(() => clearMocks());
afterEach(() => clearMocks());

// ── createBidRequest ──────────────────────────────────────────────────────────

describe("createBidRequest (mock mode)", () => {
  it("returns ok with a generated BID_ id", async () => {
    const result = await createBidRequest({
      address: "123 Oak St", city: "Daytona Beach", county: "Volusia",
      zipCode: "32118", targetListDate: Date.now(), notes: "",
      bidDeadline: Date.now() + 7 * 86_400_000, homeownerEmail: "owner@test.com",
    }) as any;
    expect(result).toHaveProperty("ok");
    expect(result.ok.id).toMatch(/^BID_/);
    expect(result.ok.city).toBe("Daytona Beach");
  });

  it("persists request so getMyBidRequests returns it", async () => {
    await createBidRequest({
      address: "456 Elm St", city: "Palm Coast", county: "Flagler",
      zipCode: "32164", targetListDate: Date.now(), notes: "",
      bidDeadline: Date.now() + 86_400_000, homeownerEmail: "owner@test.com",
    });
    const list = await getMyBidRequests();
    expect(list.length).toBe(1);
    expect(list[0].city).toBe("Palm Coast");
  });

  it("accumulates multiple requests", async () => {
    await createBidRequest({ address: "A", city: "Daytona Beach", county: "Volusia", zipCode: "32118", targetListDate: Date.now(), notes: "", bidDeadline: Date.now() + 86_400_000, homeownerEmail: "a@test.com" });
    await createBidRequest({ address: "B", city: "Palm Coast",    county: "Flagler",  zipCode: "32164", targetListDate: Date.now(), notes: "", bidDeadline: Date.now() + 86_400_000, homeownerEmail: "b@test.com" });
    const list = await getMyBidRequests();
    expect(list.length).toBe(2);
  });

  it("passes optional fields (beds, baths, sqft, desiredSalePrice) through", async () => {
    const result = await createBidRequest({
      address: "1 Lake Dr", city: "DeLand", county: "Volusia", zipCode: "32720",
      targetListDate: Date.now(), notes: "Pool", bidDeadline: Date.now() + 86_400_000,
      homeownerEmail: "o@test.com", beds: 3, baths: 2, sqft: 1800, desiredSalePrice: 320_000,
    }) as any;
    expect(result.ok.beds).toBe(3);
    expect(result.ok.baths).toBe(2);
    expect(result.ok.sqft).toBe(1800);
    expect(result.ok.desiredSalePrice).toBe(320_000);
  });
});

// ── getMyBidRequests ──────────────────────────────────────────────────────────

describe("getMyBidRequests (mock mode)", () => {
  it("returns empty array when no requests", async () => {
    const list = await getMyBidRequests();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });
});

// ── getBidRequest ─────────────────────────────────────────────────────────────

describe("getBidRequest (mock mode)", () => {
  it("returns ok when request exists", async () => {
    await createBidRequest({ address: "1 Main St", city: "DeLand", county: "Volusia", zipCode: "32720", targetListDate: Date.now(), notes: "", bidDeadline: Date.now() + 86_400_000, homeownerEmail: "a@test.com" });
    const id = (window as any).__e2e_requests[0].id;
    const result = await getBidRequest(id) as any;
    expect(result).toHaveProperty("ok");
    expect(result.ok.address).toBe("1 Main St");
  });

  it("returns NotFound when request does not exist", async () => {
    const result = await getBidRequest("NONEXISTENT_BID") as any;
    expect(result).toHaveProperty("err");
    expect(result.err).toHaveProperty("NotFound");
  });
});

// ── getOpenBidRequests ────────────────────────────────────────────────────────

const BASE_REQ = { targetListDate: BigInt(0), desiredSalePrice: [], notes: "", bidDeadline: BigInt(0), createdAt: BigInt(0), beds: [], baths: [], sqft: [] };

describe("getOpenBidRequests (mock mode)", () => {
  it("returns empty array when no requests", async () => {
    expect(await getOpenBidRequests()).toEqual([]);
  });

  it("filters to only Open status requests", async () => {
    (window as any).__e2e_requests = [
      { id: "BID_1", city: "Daytona Beach", county: "Volusia",   zipCode: "32118", status: { Open: null },      ...BASE_REQ },
      { id: "BID_2", city: "Palm Coast",    county: "Flagler",   zipCode: "32164", status: { Cancelled: null }, ...BASE_REQ },
      { id: "BID_3", city: "St. Augustine", county: "St. Johns", zipCode: "32084", status: { Expired: null },   ...BASE_REQ },
      { id: "BID_4", city: "Ormond Beach",  county: "Volusia",   zipCode: "32174", status: { Awarded: null },   ...BASE_REQ },
    ];
    const result = await getOpenBidRequests();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("BID_1");
  });

  it("includes proposalCount from matching proposals", async () => {
    (window as any).__e2e_requests  = [{ id: "BID_1", city: "Daytona Beach", county: "Volusia", zipCode: "32118", status: { Open: null }, ...BASE_REQ }];
    (window as any).__e2e_proposals = [
      { id: "PROP_1", requestId: "BID_1" },
      { id: "PROP_2", requestId: "BID_1" },
      { id: "PROP_3", requestId: "OTHER"  },
    ];
    const result = await getOpenBidRequests();
    expect(Number(result[0].proposalCount)).toBe(2);
  });

  it("returns proposalCount 0 when no proposals", async () => {
    (window as any).__e2e_requests = [{ id: "BID_1", city: "Daytona Beach", county: "Volusia", zipCode: "32118", status: { Open: null }, ...BASE_REQ }];
    const result = await getOpenBidRequests();
    expect(Number(result[0].proposalCount)).toBe(0);
  });
});

// ── getOpenBidRequestsForCities ───────────────────────────────────────────────

describe("getOpenBidRequestsForCities (mock mode)", () => {
  beforeEach(() => {
    (window as any).__e2e_requests = [
      { id: "BID_1", city: "Daytona Beach", county: "Volusia", zipCode: "32118", status: { Open: null }, ...BASE_REQ },
      { id: "BID_2", city: "Palm Coast",    county: "Flagler", zipCode: "32164", status: { Open: null }, ...BASE_REQ },
    ];
  });

  it("returns only matching city (case-insensitive)", async () => {
    const result = await getOpenBidRequestsForCities(["daytona beach"]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("BID_1");
  });

  it("returns all matching when multiple cities given", async () => {
    const result = await getOpenBidRequestsForCities(["Daytona Beach", "Palm Coast"]);
    expect(result.length).toBe(2);
  });

  it("returns empty when city does not match", async () => {
    const result = await getOpenBidRequestsForCities(["Orlando"]);
    expect(result.length).toBe(0);
  });
});

// ── submitProposal ────────────────────────────────────────────────────────────

const BASE_PROPOSAL = {
  agentBrokerage: "KW", cmaSummary: "Good comps", marketingPlan: "MLS",
  estimatedDaysOnMarket: 30, estimatedSalePrice: 350_000,
  includedServices: ["MLS"], validUntil: Date.now() + 86_400_000, coverLetter: "Hi",
};

describe("submitProposal (mock mode)", () => {
  it("returns ok with generated PROP_ id", async () => {
    const result = await submitProposal({
      requestId: "BID_1", agentName: "Jane Smith", agentEmail: "jane@kw.com",
      commissionBps: 250, ...BASE_PROPOSAL,
    }) as any;
    expect(result).toHaveProperty("ok");
    expect(result.ok.id).toMatch(/^PROP_/);
    expect(result.ok.agentName).toBe("Jane Smith");
    expect(result.ok.commissionBps).toBe(250);
  });

  it("persists proposal so getMyProposals returns it", async () => {
    await submitProposal({ requestId: "BID_1", agentName: "Jane Smith", agentEmail: "jane@kw.com", commissionBps: 250, ...BASE_PROPOSAL });
    const list = await getMyProposals();
    expect(list.length).toBe(1);
    expect(list[0].agentName).toBe("Jane Smith");
  });

  it("supports 5 concurrent proposals for the same request (multiple-agent scenario)", async () => {
    const agents = ["Alice", "Bob", "Carol", "Dave", "Eve"];
    await Promise.all(
      agents.map((name, i) =>
        submitProposal({
          requestId: "BID_MULTI", agentName: name,
          agentEmail: `${name.toLowerCase()}@kw.com`,
          commissionBps: 200 + i * 25, ...BASE_PROPOSAL,
        })
      )
    );
    const result = await getProposalsForRequest("BID_MULTI");
    expect(result.length).toBe(5);
    const names = result.map((p: any) => p.agentName);
    for (const agent of agents) expect(names).toContain(agent);
  });

  it("supports 10+ proposals (scale test)", async () => {
    const n = 10;
    await Promise.all(
      Array.from({ length: n }, (_, i) =>
        submitProposal({
          requestId: "BID_SCALE", agentName: `Agent${i}`,
          agentEmail: `agent${i}@kw.com`, commissionBps: 200 + i * 10, ...BASE_PROPOSAL,
        })
      )
    );
    const result = await getProposalsForRequest("BID_SCALE");
    expect(result.length).toBe(n);
  });
});

// ── getProposalsForRequest ────────────────────────────────────────────────────

describe("getProposalsForRequest (mock mode)", () => {
  it("returns empty array when no proposals", async () => {
    expect(await getProposalsForRequest("BID_NONE")).toEqual([]);
  });

  it("filters to proposals matching requestId only", async () => {
    await submitProposal({ requestId: "BID_A", agentName: "A", agentEmail: "a@kw.com", commissionBps: 250, ...BASE_PROPOSAL });
    await submitProposal({ requestId: "BID_B", agentName: "B", agentEmail: "b@kw.com", commissionBps: 300, ...BASE_PROPOSAL });
    const forA = await getProposalsForRequest("BID_A");
    expect(forA.length).toBe(1);
    expect(forA[0].agentName).toBe("A");
    const forB = await getProposalsForRequest("BID_B");
    expect(forB.length).toBe(1);
    expect(forB[0].agentName).toBe("B");
  });
});

// ── getMyProposals ────────────────────────────────────────────────────────────

describe("getMyProposals (mock mode)", () => {
  it("returns all proposals regardless of requestId", async () => {
    await submitProposal({ requestId: "BID_A", agentName: "A", agentEmail: "a@kw.com", commissionBps: 250, ...BASE_PROPOSAL });
    await submitProposal({ requestId: "BID_B", agentName: "B", agentEmail: "b@kw.com", commissionBps: 300, ...BASE_PROPOSAL });
    const all = await getMyProposals();
    expect(all.length).toBe(2);
  });
});

// ── No-op operations (mock mode — canister not deployed) ──────────────────────

describe("cancelBidRequest (mock mode)", () => {
  it("returns { ok: null }", async () => {
    const result = await cancelBidRequest("BID_ANY") as any;
    expect(result).toEqual({ ok: null });
  });
});

describe("markRevealNotified (mock mode)", () => {
  it("returns true", async () => {
    expect(await markRevealNotified("BID_ANY")).toBe(true);
  });
});

describe("withdrawProposal (mock mode)", () => {
  it("returns { ok: null }", async () => {
    const result = await withdrawProposal("PROP_ANY") as any;
    expect(result).toEqual({ ok: null });
  });
});

describe("expireStaleListings (mock mode)", () => {
  it("returns 0", async () => {
    expect(await expireStaleListings()).toBe(0);
  });
});

describe("getListingMetrics (mock mode)", () => {
  it("returns all-zero metrics", async () => {
    const m = await getListingMetrics();
    expect(m).toEqual({
      totalRequests:   0,
      openRequests:    0,
      awardedRequests: 0,
      expiredRequests: 0,
      totalProposals:  0,
    });
  });
});
