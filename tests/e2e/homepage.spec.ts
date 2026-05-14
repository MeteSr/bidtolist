import { test, expect } from "@playwright/test";

test.describe("HomePage", () => {
  test("shows BidtoList branding in nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("BidtoList").first()).toBeVisible();
  });

  test("shows hero heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/smarter way/i);
  });

  test("shows homeowner and agent hero CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /i'm a homeowner/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /i'm a real estate agent/i })).toBeVisible();
  });

  test("shows homeowner section with Let agents compete heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /let agents compete/i })).toBeVisible();
  });

  test("shows Post Your Home CTA link in homeowner section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /post your home/i })).toBeVisible();
  });

  test("shows agent section with Win listings heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /win listings/i })).toBeVisible();
  });

  test("shows Volusia and Flagler Counties badge", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/volusia.*flagler/i).first()).toBeVisible();
  });

  test("shows flat fee copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/\$295/).first()).toBeVisible();
  });

  test("shows no subscription callout", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/no subscription/i)).toBeVisible();
  });

  test("open-listings stat is rendered", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("stat-open-listings")).toBeVisible();
  });

  test("verified-agents stat is rendered", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("stat-verified-agents")).toBeVisible();
  });

  test("homeowner CTA links to /signup?role=homeowner", async ({ page }) => {
    await page.goto("/");
    const href = await page.getByRole("link", { name: /post your home/i }).getAttribute("href");
    expect(href).toContain("/signup?role=homeowner");
  });

  test("Sign Up nav link navigates to /signup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
