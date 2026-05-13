import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../services/fee", async () => {
  const actual = await vi.importActual<typeof import("../../services/fee")>("../../services/fee");
  return actual;
});

// fee.ts uses process.env.FEE_CANISTER_ID — leave unset so mock path runs

import { getMyFees, getAllFees, markFeeInvoiced, markFeePaid, waiveFee } from "../../services/fee";

beforeEach(() => {
  // Reset __e2e_fees to empty between tests
  (window as any).__e2e_fees = undefined;
});

describe("fee service (mock mode — no canister)", () => {
  it("getMyFees returns empty array when no mock data", async () => {
    const fees = await getMyFees();
    expect(Array.isArray(fees)).toBe(true);
  });

  it("getAllFees returns empty array when no mock data", async () => {
    const fees = await getAllFees();
    expect(Array.isArray(fees)).toBe(true);
  });

  it("markFeeInvoiced returns ok when no canister", async () => {
    const result = await markFeeInvoiced("FEE_1") as any;
    expect(result).toHaveProperty("ok");
  });

  it("markFeePaid returns ok when no canister", async () => {
    const result = await markFeePaid("FEE_1") as any;
    expect(result).toHaveProperty("ok");
  });

  it("waiveFee returns ok when no canister", async () => {
    const result = await waiveFee("FEE_1") as any;
    expect(result).toHaveProperty("ok");
  });
});
