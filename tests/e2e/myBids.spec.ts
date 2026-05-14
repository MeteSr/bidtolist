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

  test("shows My Listing Requests heading", async ({ page }) => {
    await page.goto("/my-bids");
    await expect(page.getByRole("heading", { name: /my listing requests/i })).toBeVisible();
  });

  test("shows empty state when no requests", async ({ page }) => {
    await page.goto("/my-bids");
    await expect(page.getByText(/no listing requests yet/i)).toBeVisible();
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
    await expect(page.getByText(/closes in/i)).toBeVisible();
  });

  test("shows Sealed button for open bid", async ({ page }) => {
    await injectOpenRequest(page);
    await page.goto("/my-bids");
    await expect(page.getByRole("button", { name: /^sealed$/i })).toBeVisible();
  });

  test("shows View Proposals button when deadline has passed", async ({ page }) => {
    await injectPastRequest(page);
    await page.goto("/my-bids");
    await expect(page.getByRole("button", { name: /view.*proposals/i })).toBeVisible();
  });

  test("reveals proposals on View Proposals click", async ({ page }) => {
    await injectPastRequest(page);
    await injectProposal(page);
    await page.goto("/my-bids");
    await page.getByRole("button", { name: /view.*proposals/i }).click();
    await expect(page.getByText(/jane smith/i)).toBeVisible();
    await expect(page.getByText(/keller williams/i)).toBeVisible();
  });

  test("shows commission percentage in proposal", async ({ page }) => {
    await injectPastRequest(page);
    await injectProposal(page);
    await page.goto("/my-bids");
    await page.getByRole("button", { name: /view.*proposals/i }).click();
    await expect(page.getByText(/2\.50%/)).toBeVisible();
  });

  test("shows empty proposals message when none received", async ({ page }) => {
    await injectPastRequest(page);
    await page.goto("/my-bids");
    await page.getByRole("button", { name: /view.*proposals/i }).click();
    await expect(page.getByText(/no proposals received/i)).toBeVisible();
  });

  test("shows Accept This Agent button for pending proposal", async ({ page }) => {
    await injectPastRequest(page);
    await injectProposal(page);
    await page.goto("/my-bids");
    await page.getByRole("button", { name: /view.*proposals/i }).click();
    await expect(page.getByRole("button", { name: /accept this agent/i })).toBeVisible();
  });

  test("shows review form for accepted proposal", async ({ page }) => {
    await injectPastRequest(page);
    await injectAcceptedProposal(page);
    await page.goto("/my-bids");
    await page.getByRole("button", { name: /view.*proposals/i }).click();
    await expect(page.getByTestId("review-form")).toBeVisible();
  });

  test("shows View Profile link for accepted proposal", async ({ page }) => {
    await injectPastRequest(page);
    await injectAcceptedProposal(page);
    await page.goto("/my-bids");
    await page.getByRole("button", { name: /view.*proposals/i }).click();
    await expect(page.getByRole("link", { name: /view profile/i })).toBeVisible();
  });
});
