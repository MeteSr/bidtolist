import { Page } from "@playwright/test";

export async function injectHomeownerAuth(page: Page): Promise<void> {
  await page.addInitScript(`
    window.__e2e_principal = "homeowner-test-principal";
    window.__e2e_role      = "homeowner";
  `);
}

export async function injectAgentAuth(page: Page): Promise<void> {
  await page.addInitScript(`
    window.__e2e_principal = "agent-test-principal";
    window.__e2e_role      = "agent";
  `);
}
