import { test, expect } from "@playwright/test";
import { injectHomeownerAuth } from "./helpers/auth";
import {
  injectOpenRequest,
  injectPastRequest,
  injectProposal,
  injectAcceptedProposal,
} from "./helpers/testData";

test.describe("MyBidsPage", () => {
  test.beforeEach(async ({ page }) => {
    await injectHomeownerAuth(page);
  });

  test("shows Welcome back heading", async ({ page }) => {
    await page.goto("/my-bids");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("shows empty state when no requests", async ({ page }) => {
    await page.goto("/my-bids");
    await expect(page.getByText(/no active listings yet/i)).toBeVisible();
  });

  test("shows request address for open bid", async ({ page }) => {
    await injectOpenRequest(page);
    await page.goto("/my-bids");
    await expect(page.getByText(/123 Oak St/i)).toBeVisible();
    await expect(page.getByText(/volusia/i)).toBeVisible();
  });

  test("shows countdown for open bid window", async ({ page }) => {
    await injectOpenRequest(page);
    await page.goto("/my-bids");
    // Use digit after "in" to distinguish "Closes in 7d..." from "Bidding Closes In"
    await expect(page.getByText(/Closes in \d/i)).toBeVisible();
  });

  test("shows bids sealed message for open bid", async ({ page }) => {
    await injectOpenRequest(page);
    await page.goto("/my-bids");
    await expect(page.getByText(/bids are sealed until the deadline/i)).toBeVisible();
  });

  test("shows no-proposals message when deadline has passed", async ({ page }) => {
    await injectPastRequest(page);
    await page.goto("/my-bids");
    await expect(page.getByText(/no proposals received/i)).toBeVisible();
  });

  test("shows proposals inline after deadline", async ({ page }) => {
    await injectPastRequest(page);
    await injectProposal(page);
    await page.goto("/my-bids");
    // Proposals render inline — no reveal click needed
    await expect(page.getByText(/jane smith/i).first()).toBeVisible();
    await expect(page.getByText(/keller williams/i).first()).toBeVisible();
  });

  test("shows commission percentage in proposal", async ({ page }) => {
    await injectPastRequest(page);
    await injectProposal(page);
    await page.goto("/my-bids");
    await expect(page.getByText(/2\.50%/).first()).toBeVisible();
  });

  test("shows empty proposals message when none received", async ({ page }) => {
    await injectPastRequest(page);
    await page.goto("/my-bids");
    await expect(page.getByText(/no proposals received/i)).toBeVisible();
  });

  test("shows Select Agent button for pending proposal", async ({ page }) => {
    await injectPastRequest(page);
    await injectProposal(page);
    await page.goto("/my-bids");
    await expect(page.getByRole("button", { name: /select agent/i })).toBeVisible();
  });

  test("shows review form for accepted proposal", async ({ page }) => {
    await injectPastRequest(page);
    await injectAcceptedProposal(page);
    await page.goto("/my-bids");
    await expect(page.getByTestId("review-form")).toBeVisible();
  });

  test("shows View Profile link for accepted proposal", async ({ page }) => {
    await injectPastRequest(page);
    await injectAcceptedProposal(page);
    await page.goto("/my-bids");
    await expect(page.getByRole("link", { name: /view profile/i })).toBeVisible();
  });
});
