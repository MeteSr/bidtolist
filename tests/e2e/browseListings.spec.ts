import { test, expect } from "@playwright/test";
import { injectOpenRequest } from "./helpers/testData";

test.describe("BrowseListingsPage", () => {
  test("shows Open Listings heading", async ({ page }) => {
    await page.goto("/agents/browse");
    await expect(page.getByRole("heading", { name: /open listings/i })).toBeVisible();
  });

  test("shows empty state when no requests", async ({ page }) => {
    await page.goto("/agents/browse");
    await expect(page.getByText(/no open listings/i)).toBeVisible();
  });

  test("shows injected listing city and county", async ({ page }) => {
    await injectOpenRequest(page);
    await page.goto("/agents/browse");
    await expect(page.getByText(/daytona beach/i)).toBeVisible();
    await expect(page.getByText(/Volusia County/)).toBeVisible();
  });

  test("shows bid countdown for open listing", async ({ page }) => {
    await injectOpenRequest(page);
    await page.goto("/agents/browse");
    await expect(page.getByText(/closes in/i)).toBeVisible();
  });

  test("county filter All shows all listings", async ({ page }) => {
    await injectOpenRequest(page);
    await page.goto("/agents/browse");
    await page.getByRole("button", { name: /^all$/i }).click();
    await expect(page.getByText(/daytona beach/i)).toBeVisible();
  });

  test("county filter Volusia shows Volusia listing", async ({ page }) => {
    await injectOpenRequest(page);
    await page.goto("/agents/browse");
    await page.getByRole("button", { name: /volusia/i }).click();
    await expect(page.getByText(/daytona beach/i)).toBeVisible();
  });

  test("county filter Flagler hides Volusia listing", async ({ page }) => {
    await injectOpenRequest(page);
    await page.goto("/agents/browse");
    await page.getByRole("button", { name: /flagler/i }).click();
    await expect(page.getByText(/daytona beach/i)).not.toBeVisible();
  });

  test("BidtoList nav link is present", async ({ page }) => {
    await page.goto("/agents/browse");
    await expect(page.getByRole("link", { name: /bidtolist/i })).toBeVisible();
  });
});
