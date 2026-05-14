import { test, expect } from "@playwright/test";
import { injectAgentAuth } from "./helpers/auth";
import { injectAcceptedProposal, injectProposal } from "./helpers/testData";

test.describe("AgentDashboardPage", () => {
  test.beforeEach(async ({ page }) => {
    await injectAgentAuth(page);
  });

  test("shows My Proposals heading", async ({ page }) => {
    await page.goto("/agents/dashboard");
    await expect(page.getByRole("heading", { name: /my proposals/i })).toBeVisible();
  });

  test("shows empty state when no proposals", async ({ page }) => {
    await page.goto("/agents/dashboard");
    await expect(page.getByText(/no proposals yet/i)).toBeVisible();
  });

  test("shows pending proposal section", async ({ page }) => {
    await injectProposal(page);
    await page.goto("/agents/dashboard");
    await expect(page.getByText(/pending/i).first()).toBeVisible();
  });

  test("shows accepted proposal section", async ({ page }) => {
    await injectAcceptedProposal(page);
    await page.goto("/agents/dashboard");
    await expect(page.getByText(/accepted/i).first()).toBeVisible();
  });

  test("shows Pay Now button for accepted proposal with owed fee", async ({ page }) => {
    await injectAcceptedProposal(page);
    await page.goto("/agents/dashboard");
    await expect(page.getByTestId("pay-now-PROP_2")).toBeVisible();
  });

  test("nav shows Browse Listings link", async ({ page }) => {
    await page.goto("/agents/dashboard");
    await expect(page.getByRole("link", { name: /browse listings/i })).toBeVisible();
  });
});
