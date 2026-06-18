import { test, expect } from "@playwright/test";

const PROPOSAL_ID = "PROP_award_e2e";

async function injectAwardData(
  page: Parameters<Parameters<typeof test>[1]>[0],
  opts: { paid?: boolean; expired?: boolean } = {}
) {
  const now = Date.now();
  const createdMs = opts.expired
    ? now - 25 * 60 * 60 * 1_000   // 25h ago — past deadline
    : now - 1 * 60 * 60 * 1_000;   // 1h ago — still live

  await page.addInitScript(
    ({ proposalId, createdMs: cms, paid }: { proposalId: string; createdMs: number; paid: boolean }) => {
      (window as any).__e2e_proposals = [
        {
          id: proposalId,
          requestId: "BID_TESTABCD",
          agentId: "mock",
          agentName: "Test Agent",
          agentEmail: "agent@test.com",
          agentBrokerage: "Test Realty",
          commissionBps: 300,
          estimatedSalePrice: 500000,
          estimatedDaysOnMarket: 30,
          includedServices: [],
          validUntil: cms + 86_400_000,
          cmaSummary: "",
          marketingPlan: "",
          coverLetter: "",
          status: { Accepted: null },
          createdAt: cms,
        },
      ];
      (window as any).__e2e_fees = [
        {
          id: "FEE_e2e_001",
          requestId: "BID_TESTABCD",
          proposalId,
          agentId: "mock",
          homeownerId: "mock",
          amountCents: BigInt(39500),
          status: paid ? { Paid: null } : { Owed: null },
          createdAt: BigInt(cms) * BigInt(1_000_000),
          updatedAt: BigInt(cms) * BigInt(1_000_000),
        },
      ];
    },
    { proposalId: PROPOSAL_ID, createdMs, paid: opts.paid ?? false }
  );
}

test.describe("ListingAwardPage (/agents/listing-award/:id)", () => {

  // ── Celebration banner ────────────────────────────────────────────────────────

  test("shows Congratulations heading", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByRole("heading", { name: /congratulations/i })).toBeVisible();
  });

  test("shows LISTING AWARDED badge", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/listing awarded/i)).toBeVisible();
  });

  test("shows selected-to-represent subheading", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/you've been selected to represent this property/i)).toBeVisible();
  });

  // ── Countdown timer ───────────────────────────────────────────────────────────

  test("shows countdown timer with HRS MIN SEC labels", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByTestId("countdown")).toBeVisible();
    await expect(page.getByText("HRS")).toBeVisible();
    await expect(page.getByText("MIN")).toBeVisible();
    await expect(page.getByText("SEC")).toBeVisible();
  });

  test("shows PAYMENT DUE IN label on countdown card", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/payment due in/i)).toBeVisible();
  });

  test("shows 24-hour reservation note", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/24 hours/i).first()).toBeVisible();
  });

  // ── Property card ─────────────────────────────────────────────────────────────

  test("shows listing ID in property card", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/listing #/i)).toBeVisible();
  });

  test("shows address revealed after payment placeholder", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/revealed after payment/i).first()).toBeVisible();
  });

  test("shows homeowner revealed after payment placeholder", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    const cells = page.getByText(/revealed after payment/i);
    await expect(cells.nth(0)).toBeVisible();
    await expect(cells.nth(1)).toBeVisible();
  });

  test("does NOT show raw homeowner name or address", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/sarah thompson/i)).not.toBeVisible();
    await expect(page.getByText(/123 pelican bay/i)).not.toBeVisible();
  });

  // ── Success fee card ──────────────────────────────────────────────────────────

  test("shows Your Success Fee section with $395", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/your success fee/i)).toBeVisible();
    await expect(page.getByText(/\$395/i).first()).toBeVisible();
  });

  test("shows no-subscriptions, no-recurring, no-hidden-fees checklist", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/no subscriptions/i)).toBeVisible();
    await expect(page.getByText(/no recurring charges/i)).toBeVisible();
    await expect(page.getByText(/no hidden fees/i)).toBeVisible();
  });

  // ── What happens next card ────────────────────────────────────────────────────

  test("shows What Happens Next section", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/what happens next/i).first()).toBeVisible();
  });

  test("shows all four timeline steps", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/pay success fee/i)).toBeVisible();
    await expect(page.getByText(/listing activated/i).first()).toBeVisible();
    await expect(page.getByText(/homeowner contact unlocked/i)).toBeVisible();
    await expect(page.getByText(/begin working together/i)).toBeVisible();
  });

  // ── Commission card ───────────────────────────────────────────────────────────

  test("shows Estimated Commission section", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/estimated commission/i)).toBeVisible();
  });

  test("shows BidToList Success Fee deduction", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/bidtolist success fee/i)).toBeVisible();
  });

  test("shows You Keep section in green", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/you keep/i)).toBeVisible();
  });

  // ── Checkout section ──────────────────────────────────────────────────────────

  test("shows Complete Checkout heading", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByRole("heading", { name: /complete checkout/i })).toBeVisible();
  });

  test("shows Credit Card payment option selected", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/credit card/i)).toBeVisible();
    await expect(page.getByText(/visa/i)).toBeVisible();
  });

  test("shows ACH Bank Transfer option", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/ach bank transfer/i)).toBeVisible();
    await expect(page.getByText(/recommended for brokerages/i)).toBeVisible();
  });

  test("shows ICP Payments as Coming Soon", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/icp payments/i)).toBeVisible();
    await expect(page.getByText(/coming soon/i)).toBeVisible();
  });

  test("shows billing summary with $0.00 processing fee and tax", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/billing summary/i)).toBeVisible();
    await expect(page.getByText(/processing fee/i)).toBeVisible();
  });

  test("shows Pay & Activate Listing CTA button", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByTestId("pay-cta")).toBeVisible();
    await expect(page.getByTestId("pay-cta")).toContainText(/pay.*activate listing/i);
  });

  test("shows no-surprises trust strip", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/one-time fee/i)).toBeVisible();
    await expect(page.getByText(/no contracts/i)).toBeVisible();
    await expect(page.getByText(/instant receipt/i)).toBeVisible();
  });

  test("shows secure checkout encryption note", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/secure checkout powered by/i)).toBeVisible();
  });

  // ── Trust footer ──────────────────────────────────────────────────────────────

  test("shows Built on Trust. Backed by Security. section", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByRole("heading", { name: /built on trust/i })).toBeVisible();
  });

  test("shows Verified Agents, Secure Platform, Trusted by Thousands cards", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/verified agents/i)).toBeVisible();
    await expect(page.getByText(/secure platform/i)).toBeVisible();
    await expect(page.getByText(/trusted by thousands/i)).toBeVisible();
  });

  test("shows Back to Dashboard link in footer", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByRole("link", { name: /back to dashboard/i })).toBeVisible();
  });

  // ── Success screen (?paid=1) ──────────────────────────────────────────────────

  test("shows Listing Activated success screen when ?paid=1", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}?paid=1`);
    await expect(page.getByTestId("success-heading")).toBeVisible();
    await expect(page.getByText(/listing activated/i)).toBeVisible();
  });

  test("success screen shows What Happens Next with email note", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}?paid=1`);
    await expect(page.getByText(/what happens next/i)).toBeVisible();
    await expect(page.getByText(/check your email for homeowner contact/i)).toBeVisible();
  });

  test("success screen shows View My Dashboard link to /agents/dashboard", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}?paid=1`);
    const link = page.getByTestId("view-dashboard-link");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/agents/dashboard");
  });

  test("success screen shows Browse More Listings link", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}?paid=1`);
    await expect(page.getByRole("link", { name: /browse more listings/i })).toBeVisible();
  });

  test("success screen shows when fee status is Paid", async ({ page }) => {
    await injectAwardData(page, { paid: true });
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByTestId("success-heading")).toBeVisible();
  });

  // ── Nav ───────────────────────────────────────────────────────────────────────

  test("shows logo in navbar", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByRole("img", { name: /bidtolist/i })).toBeVisible();
  });

  test("shows Contact Support link in navbar", async ({ page }) => {
    await injectAwardData(page);
    await page.goto(`/agents/listing-award/${PROPOSAL_ID}`);
    await expect(page.getByText(/contact support/i)).toBeVisible();
  });

  // ── Redirect ──────────────────────────────────────────────────────────────────

  test("redirects to /agents/dashboard when proposalId not found", async ({ page }) => {
    await page.goto("/agents/listing-award/NONEXISTENT_ID");
    await expect(page).toHaveURL(/\/agents\/dashboard/);
  });
});
