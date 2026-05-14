import { test, expect } from "@playwright/test";
import { injectAgentProfile, injectAgentProfileWithReviews } from "./helpers/testData";

test.describe("AgentProfilePage", () => {
  test("shows not found for unknown agent", async ({ page }) => {
    await page.goto("/agents/profile/unknown-id");
    await expect(page.getByText(/agent profile not found/i)).toBeVisible();
  });

  test("shows agent name", async ({ page }) => {
    await injectAgentProfile(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByText("Jane Smith")).toBeVisible();
  });

  test("shows brokerage and license", async ({ page }) => {
    await injectAgentProfile(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByText(/keller williams/i)).toBeVisible();
    await expect(page.getByText(/SL3123456/)).toBeVisible();
  });

  test("shows Verified badge", async ({ page }) => {
    await injectAgentProfile(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByText(/verified/i)).toBeVisible();
  });

  test("shows bio text", async ({ page }) => {
    await injectAgentProfile(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByText(/top agent in daytona beach/i)).toBeVisible();
  });

  test("shows avg days on market stat", async ({ page }) => {
    await injectAgentProfile(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByText("22")).toBeVisible();
  });

  test("shows No reviews yet when no reviews", async ({ page }) => {
    await injectAgentProfile(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByText(/no reviews yet/i)).toBeVisible();
  });

  test("shows review comment when reviews injected", async ({ page }) => {
    await injectAgentProfileWithReviews(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByText(/outstanding service/i)).toBeVisible();
  });

  test("shows review count in section heading", async ({ page }) => {
    await injectAgentProfileWithReviews(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByText(/homeowner reviews \(2\)/i)).toBeVisible();
  });

  test("shows average rating", async ({ page }) => {
    await injectAgentProfileWithReviews(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByText(/4\.5/)).toBeVisible();
  });

  test("BidtoList nav link present", async ({ page }) => {
    await injectAgentProfile(page);
    await page.goto("/agents/profile/agent-test-principal");
    await expect(page.getByRole("link", { name: /bidtolist/i })).toBeVisible();
  });
});
