import { test, expect } from "@playwright/test";
import { injectHomeownerAuth } from "./helpers/auth";

test.describe("PostListingPage — unauthenticated", () => {
  test("shows sign-in gate when not logged in", async ({ page }) => {
    await page.goto("/post");
    await expect(page.getByTestId("sign-in-gate")).toBeVisible();
  });
});

test.describe("PostListingPage — authenticated, not verified", () => {
  test.beforeEach(async ({ page }) => {
    await injectHomeownerAuth(page);
  });

  test("shows verify ownership prompt", async ({ page }) => {
    await page.goto("/post");
    await expect(page.getByText(/verify your ownership/i)).toBeVisible();
  });

  test("shows Start Verification link", async ({ page }) => {
    await page.goto("/post");
    await expect(page.getByRole("link", { name: /start verification/i })).toBeVisible();
  });
});

test.describe("PostListingPage — authenticated and verified", () => {
  test.beforeEach(async ({ page }) => {
    await injectHomeownerAuth(page);
    await page.addInitScript(`window.__e2e_homeowner_verified = true;`);
  });

  test("shows Post Your Listing heading", async ({ page }) => {
    await page.goto("/post");
    await expect(page.getByRole("heading", { name: /post your listing/i })).toBeVisible();
  });

  test("shows the listing form", async ({ page }) => {
    await page.goto("/post");
    await expect(page.getByLabel(/street address/i)).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();
    await expect(page.getByLabel(/zip code/i)).toBeVisible();
  });

  test("submit navigates to /my-bids", async ({ page }) => {
    await page.goto("/post");
    await page.getByLabel(/street address/i).fill("789 Pine Rd");
    await page.getByLabel(/city/i).fill("Daytona Beach");
    await page.getByLabel(/zip code/i).fill("32118");
    await page.getByLabel(/target list date/i).fill("2026-09-01");
    await page.getByLabel(/contact email/i).fill("owner@example.com");
    await page.getByRole("button", { name: /post listing/i }).click();
    await expect(page).toHaveURL(/my-bids/);
  });
});
