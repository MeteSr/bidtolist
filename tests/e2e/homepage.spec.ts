import { test, expect } from "@playwright/test";

test.describe("HomePage", () => {
  test("shows BidtoList branding in nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("BidtoList").first()).toBeVisible();
  });

  test("shows hero heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/let agents.*compete/i);
  });

  test("shows homeowner and agent hero CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /post your home/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /join as an agent/i }).first()).toBeVisible();
  });

  test("shows homeowner section with let agents compete heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/let agents/i);
  });

  test("shows Post Your Home CTA link in homeowner section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /post your home/i }).first()).toBeVisible();
  });

  test("shows agent section with Win listings heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/win listings/i).first()).toBeVisible();
  });

  test("shows brokerage band for agents", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/serving agents from/i)).toBeVisible();
  });

  test("shows flat fee copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/\$295/).first()).toBeVisible();
  });

  test("shows no subscription callout", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/no subscription/i).first()).toBeVisible();
  });

  test("homeowner cost stat is rendered", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("stat-homeowner-cost")).toBeVisible();
  });

  test("agent fee stat is rendered", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("stat-agent-fee")).toBeVisible();
  });

  test("homeowner CTA links to /signup?role=homeowner", async ({ page }) => {
    await page.goto("/");
    const href = await page.getByRole("link", { name: /post your home/i }).first().getAttribute("href");
    expect(href).toContain("/signup?role=homeowner");
  });

  test("Sign Up nav link navigates to /signup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
