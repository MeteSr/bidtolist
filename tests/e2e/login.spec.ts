import { test, expect } from "@playwright/test";
import { injectHomeownerAuth, injectAgentAuth } from "./helpers/auth";

test.describe("LoginPage (/login)", () => {
  // ── Layout ──────────────────────────────────────────────────────────────────

  test("shows Welcome to BidToList heading", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome to bidtolist/i })).toBeVisible();
  });

  test("shows Log In and Sign Up tabs", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /^log in$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign up$/i })).toBeVisible();
  });

  test("shows Internet Identity button with ICP badge by default", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /continue with internet identity/i })).toBeVisible();
    await expect(page.getByText("ICP").first()).toBeVisible();
  });

  test("shows Google, Apple and Microsoft provider buttons", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with apple/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with microsoft/i })).toBeVisible();
  });

  test("shows trust strip — ICP Secured, Encrypted, Verified Marketplace", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/icp secured/i)).toBeVisible();
    await expect(page.getByText(/encrypted/i)).toBeVisible();
    await expect(page.getByText(/verified marketplace/i)).toBeVisible();
  });

  test("shows Contact Support link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /contact support/i })).toBeVisible();
  });

  // ── Left panel ──────────────────────────────────────────────────────────────

  test("shows brand tagline on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await expect(page.getByText(/agents compete. homeowners win./i)).toBeVisible();
  });

  test("shows glassmorphism testimonial card on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await expect(page.getByText(/sarah m\./i)).toBeVisible();
    await expect(page.getByText(/naples homeowner/i)).toBeVisible();
  });

  // ── Sign Up flow ─────────────────────────────────────────────────────────────

  test("Sign Up tab shows role selection", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^sign up$/i }).click();
    await expect(page.getByRole("button", { name: /homeowner/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /real estate agent/i })).toBeVisible();
  });

  test("selecting Homeowner advances to auth step with correct label", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^sign up$/i }).click();
    await page.getByRole("button", { name: /homeowner/i }).click();
    await expect(page.getByText(/joining as:.*homeowner/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account with internet identity/i })).toBeVisible();
  });

  test("selecting Real Estate Agent advances to auth step with correct label", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^sign up$/i }).click();
    await page.getByRole("button", { name: /real estate agent/i }).click();
    await expect(page.getByText(/joining as:.*real estate agent/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up with google/i })).toBeVisible();
  });

  test("Change role returns to role selection step", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^sign up$/i }).click();
    await page.getByRole("button", { name: /homeowner/i }).click();
    await page.getByRole("button", { name: /change role/i }).click();
    await expect(page.getByRole("button", { name: /homeowner/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /real estate agent/i })).toBeVisible();
  });

  // ── ?tab=signup deep link ───────────────────────────────────────────────────

  test("?tab=signup opens Sign Up tab directly", async ({ page }) => {
    await page.goto("/login?tab=signup");
    await expect(page.getByRole("button", { name: /homeowner/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /real estate agent/i })).toBeVisible();
  });

  // ── Auth redirect ───────────────────────────────────────────────────────────

  test("authenticated homeowner is redirected to /my-bids", async ({ page }) => {
    await injectHomeownerAuth(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/my-bids/);
  });

  test("authenticated agent is redirected to /agents/dashboard", async ({ page }) => {
    await injectAgentAuth(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/agents\/dashboard/);
  });

  // ── Log In nav link from home ────────────────────────────────────────────────

  test("Log In button on HomePage navigates to /login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^log in$/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
