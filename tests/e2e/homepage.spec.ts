import { test, expect } from "@playwright/test";

test.describe("HomePage", () => {
  test("shows BidtoList branding in nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("BidtoList").first()).toBeVisible();
  });

  test("shows hero heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(/listings/i);
  });

  test("shows Get Started and How It Works hero CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /how it works/i }).first()).toBeVisible();
  });

  test("shows how BidToList works section heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /how bidtolist works/i })).toBeVisible();
  });

  test("shows Get Started CTA link in hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
  });

  test("shows Best Bid Wins step", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/best bid wins/i).first()).toBeVisible();
  });

  test("shows Trusted by Agents section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/trusted by agents/i)).toBeVisible();
  });

  test("shows Built for Realtors copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/built for realtors/i).first()).toBeVisible();
  });

  test("shows Keller Williams in trust band", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/keller williams/i)).toBeVisible();
  });

  test("shows Agents Bid step", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/agents bid/i)).toBeVisible();
  });

  test("Get Started CTA links to /signup", async ({ page }) => {
    await page.goto("/");
    const href = await page.getByRole("link", { name: /get started/i }).first().getAttribute("href");
    expect(href).toContain("/signup");
  });

  test("Sign Up nav link navigates to /signup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
