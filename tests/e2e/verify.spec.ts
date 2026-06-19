import { test, expect } from "@playwright/test";

test.describe("HomeownerVerifyPage (/verify)", () => {

  // ── Layout ───────────────────────────────────────────────────────────────────

  test("shows Verify Your Homeownership heading", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /verify your homeownership/i })).toBeVisible();
  });

  test("shows progress bar with Step 2 (Verify Ownership) active", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/verify ownership/i)).toBeVisible();
  });

  test("shows Create Listing as completed step in progress bar", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/create listing/i)).toBeVisible();
  });

  test("shows Receive Proposals as upcoming step in progress bar", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/receive proposals/i)).toBeVisible();
  });

  // ── Step sections ─────────────────────────────────────────────────────────────

  test("shows Step 1 — Government-Issued Photo ID", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /government-issued photo id/i })).toBeVisible();
  });

  test("shows Step 2 — Proof of Property Ownership", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /proof of property ownership/i })).toBeVisible();
  });

  test("shows Step 3 — Selfie Verification", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /selfie verification/i })).toBeVisible();
  });

  test("shows Step 4 — Verify Contact Information", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /verify contact information/i })).toBeVisible();
  });

  test("shows Step 5 — Ownership Declaration", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /ownership declaration/i })).toBeVisible();
  });

  // ── Required form fields ──────────────────────────────────────────────────────

  test("shows Street Address field", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByLabel(/street address/i)).toBeVisible();
  });

  test("shows Parcel Number field", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByLabel(/parcel number/i)).toBeVisible();
  });

  test("shows Contact Email field", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByLabel(/contact email/i)).toBeVisible();
  });

  // ── County appraiser links ────────────────────────────────────────────────────

  test("shows Volusia County appraiser link", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/volusia county/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /vcpa\.vcgov\.org/i })).toBeVisible();
  });

  test("shows Flagler County appraiser link", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/flagler county/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /flaglerpa\.com/i })).toBeVisible();
  });

  // ── Upload zones ──────────────────────────────────────────────────────────────

  test("shows Photo ID upload zone with Choose File button", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/drag & drop here/i).first()).toBeVisible();
  });

  test("shows Take Photo and Upload Photo buttons in Selfie section", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("button", { name: /take photo/i })).toBeVisible();
    await expect(page.getByText(/upload photo/i).first()).toBeVisible();
  });

  // ── Ownership Declaration radio buttons ───────────────────────────────────────

  test("defaults to 'I am the owner' radio selected", async ({ page }) => {
    await page.goto("/verify");
    const ownerRadio = page.getByRole("radio", { name: /i am the owner of this property/i });
    await expect(ownerRadio).toBeChecked();
  });

  test("selecting 'authorized representative' shows authorization doc upload", async ({ page }) => {
    await page.goto("/verify");
    await page.getByRole("radio", { name: /authorized representative/i }).check();
    await expect(page.getByText(/upload authorization documentation/i)).toBeVisible();
    await expect(page.getByText(/power of attorney, estate, or trustee/i)).toBeVisible();
  });

  test("selecting 'power of attorney' shows authorization doc upload", async ({ page }) => {
    await page.goto("/verify");
    await page.getByRole("radio", { name: /power of attorney/i }).check();
    await expect(page.getByText(/upload authorization documentation/i)).toBeVisible();
  });

  test("switching back to 'owner' hides authorization doc upload", async ({ page }) => {
    await page.goto("/verify");
    await page.getByRole("radio", { name: /authorized representative/i }).check();
    await expect(page.getByText(/upload authorization documentation/i)).toBeVisible();
    await page.getByRole("radio", { name: /i am the owner of this property/i }).check();
    await expect(page.getByText(/upload authorization documentation/i)).not.toBeVisible();
  });

  // ── Sidebar (desktop only) ────────────────────────────────────────────────────

  test("shows Verification Checklist in sidebar on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /verification checklist/i })).toBeVisible();
  });

  test("shows all 5 checklist items on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/verify");
    await expect(page.getByText(/photo id/i).first()).toBeVisible();
    await expect(page.getByText(/proof of ownership/i).first()).toBeVisible();
    await expect(page.getByText(/selfie verification/i).first()).toBeVisible();
    await expect(page.getByText(/email verification/i)).toBeVisible();
    await expect(page.getByText(/ownership declaration/i).first()).toBeVisible();
  });

  test("shows Accepted Documents section on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /accepted documents/i })).toBeVisible();
    await expect(page.getByText(/utility bill/i).first()).toBeVisible();
    await expect(page.getByText(/property tax statement/i)).toBeVisible();
  });

  test("shows privacy section on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/verify");
    await expect(page.getByRole("heading", { name: /your information is protected/i })).toBeVisible();
    await expect(page.getByText(/bank-level encryption/i)).toBeVisible();
    await expect(page.getByText(/never sold/i).first()).toBeVisible();
  });

  // ── Sticky footer ─────────────────────────────────────────────────────────────

  test("shows Complete Verification button in sticky footer", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("button", { name: /complete verification/i })).toBeVisible();
  });

  test("shows Save and Finish Later button in sticky footer", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("button", { name: /save and finish later/i })).toBeVisible();
  });

  test("shows step progress indicator in footer", async ({ page }) => {
    await page.goto("/verify");
    // Declaration step is auto-complete so 1/5 shown initially
    await expect(page.getByText(/\d of 5 steps complete/i)).toBeVisible();
  });

  // ── Form submission ───────────────────────────────────────────────────────────

  test("fills required fields and submits — shows Request Submitted", async ({ page }) => {
    await page.goto("/verify");
    await page.getByLabel(/street address/i).fill("123 Main St, Daytona Beach, FL 32118");
    await page.getByLabel(/parcel number/i).fill("7001-00-00-0010");
    await page.getByLabel(/contact email/i).fill("owner@example.com");
    await page.getByRole("button", { name: /complete verification/i }).click();
    await expect(page.getByRole("heading", { name: /request submitted/i })).toBeVisible();
  });

  test("success screen shows notification email", async ({ page }) => {
    await page.goto("/verify");
    await page.getByLabel(/street address/i).fill("123 Main St, Daytona Beach, FL 32118");
    await page.getByLabel(/parcel number/i).fill("7001-00-00-0010");
    await page.getByLabel(/contact email/i).fill("owner@example.com");
    await page.getByRole("button", { name: /complete verification/i }).click();
    await expect(page.getByText(/owner@example\.com/)).toBeVisible();
  });

  test("success screen shows What Happens Next steps", async ({ page }) => {
    await page.goto("/verify");
    await page.getByLabel(/street address/i).fill("456 Palm Ave");
    await page.getByLabel(/parcel number/i).fill("4002-00-00-0001");
    await page.getByLabel(/contact email/i).fill("test@test.com");
    await page.getByRole("button", { name: /complete verification/i }).click();
    await expect(page.getByText(/what happens next/i)).toBeVisible();
    await expect(page.getByText(/agents begin reviewing/i)).toBeVisible();
  });

  test("success screen shows View My Dashboard link to /my-bids", async ({ page }) => {
    await page.goto("/verify");
    await page.getByLabel(/street address/i).fill("789 Oak Dr");
    await page.getByLabel(/parcel number/i).fill("5003-00-00-0001");
    await page.getByLabel(/contact email/i).fill("home@owner.com");
    await page.getByRole("button", { name: /complete verification/i }).click();
    const dashLink = page.getByRole("link", { name: /view my dashboard/i });
    await expect(dashLink).toBeVisible();
    await expect(dashLink).toHaveAttribute("href", "/my-bids");
  });

  test("success screen shows View My Listing link", async ({ page }) => {
    await page.goto("/verify");
    await page.getByLabel(/street address/i).fill("789 Oak Dr");
    await page.getByLabel(/parcel number/i).fill("5003-00-00-0001");
    await page.getByLabel(/contact email/i).fill("home@owner.com");
    await page.getByRole("button", { name: /complete verification/i }).click();
    await expect(page.getByRole("link", { name: /view my listing/i })).toBeVisible();
  });

  // ── Trust / security badges ───────────────────────────────────────────────────

  test("shows Secure, Private, Encrypted badges near heading", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/\bsecure\b/i).first()).toBeVisible();
    await expect(page.getByText(/\bprivate\b/i).first()).toBeVisible();
    await expect(page.getByText(/\bencrypted\b/i).first()).toBeVisible();
  });
});
