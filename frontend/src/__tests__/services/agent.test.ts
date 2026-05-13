import { describe, it, expect, vi, beforeEach } from "vitest";

// agent.ts uses process.env.AGENT_CANISTER_ID — leave unset so mock path runs

import { addReview, getReviews, getAgentProfile } from "../../services/agent";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("agent service reviews (mock mode — no canister)", () => {
  it("addReview returns ok with review object", async () => {
    const result = await addReview({
      agentId: "principal-test", rating: 5, comment: "Great!", transactionId: "PROP_1",
    }) as any;
    expect(result).toHaveProperty("ok");
    expect(result.ok.transactionId).toBe("PROP_1");
    expect(Number(result.ok.rating)).toBe(5);
  });

  it("addReview returns DuplicateReview on second submission for same transaction", async () => {
    await addReview({ agentId: "principal-dup", rating: 4, comment: "", transactionId: "PROP_DUP" });
    const result = await addReview({ agentId: "principal-dup", rating: 3, comment: "", transactionId: "PROP_DUP" }) as any;
    expect(result).toHaveProperty("err");
    expect(result.err).toHaveProperty("DuplicateReview");
  });

  it("getReviews returns array", async () => {
    const reviews = await getReviews("any-principal");
    expect(Array.isArray(reviews)).toBe(true);
  });

  it("getAgentProfile returns null when no canister", async () => {
    const profile = await getAgentProfile("any-principal");
    expect(profile).toBeNull();
  });
});
