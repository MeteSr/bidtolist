import { test, expect } from "@playwright/test";

test.describe("HomePage", () => {
  test("shows BidtoList branding in nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("BidtoList").first()).toBeVisible();
  });

  test("shows hero heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("agents compete");
  });

  test("shows Post Your Home CTA button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /post your home/i })).toBeVisible();
  });

  test("shows Browse Listings link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /browse/i }).first()).toBeVisible();
  });

  test("shows How It Works section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/how it works/i)).toBeVisible();
  });

  test("shows Volusia and Flagler Counties badge", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/volusia.*flagler/i).first()).toBeVisible();
  });

  test("shows flat fee copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/\$295/).first()).toBeVisible();
  });

  test("open-listings stat is rendered", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("stat-open-listings")).toBeVisible();
  });

  test("verified-agents stat is rendered", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("stat-verified-agents")).toBeVisible();
  });

  test("Browse link navigates to /agents/browse", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /browse listings/i }).first().click();
    await expect(page).toHaveURL(/agents\/browse/);
  });
});
