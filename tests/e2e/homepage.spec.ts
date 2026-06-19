import { test, expect } from "@playwright/test";

test.describe("HomePage", () => {
  test("shows BidtoList branding in nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("BidtoList").first()).toBeVisible();
  });

  test("shows hero heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(/let them compete/i);
  });

  test("shows Post Your Home Free and See How It Works hero CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /post your home free/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /see how it works/i }).first()).toBeVisible();
  });

  test("shows How It Works section heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /how it works/i })).toBeVisible();
  });

  test("shows Post Your Home Free CTA link in hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /post your home free/i }).first()).toBeVisible();
  });

  test("shows Choose the Best Fit step", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/choose the best fit/i).first()).toBeVisible();
  });

  test("shows Why Homeowners Use BidToList section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/why homeowners use bidtolist/i)).toBeVisible();
  });

  test("shows The BidToList Way in comparison table", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/the bidtolist way/i).first()).toBeVisible();
  });

  test("shows Pelican Bay in testimonials", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/pelican bay/i)).toBeVisible();
  });

  test("shows Agents Compete step", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/agents compete/i).first()).toBeVisible();
  });

  test("Post Your Home Free CTA links to /login", async ({ page }) => {
    await page.goto("/");
    const href = await page.getByRole("link", { name: /post your home free/i }).first().getAttribute("href");
    expect(href).toContain("/login");
  });

  test("Log In button navigates to /login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
