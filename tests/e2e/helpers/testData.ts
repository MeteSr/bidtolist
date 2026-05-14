import { Page } from "@playwright/test";

// ── Bid Request injection ─────────────────────────────────────────────────────

export async function injectOpenRequest(page: Page): Promise<void> {
  const futureMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
  await page.addInitScript(`
    window.__e2e_requests = [{
      id: "BID_1",
      address:          "123 Oak St",
      city:             "Daytona Beach",
      county:           "Volusia",
      zipCode:          "32118",
      homeowner:        "homeowner-test-principal",
      homeownerEmail:   "owner@example.com",
      targetListDate:   BigInt(0),
      desiredSalePrice: [],
      notes:            "Corner lot with pool",
      bidDeadline:      BigInt(${futureMs}) * 1000000n,
      status:           { Open: null },
      createdAt:        BigInt(0),
    }];
  `);
}

export async function injectPastRequest(page: Page): Promise<void> {
  const pastMs = Date.now() - 2 * 24 * 60 * 60 * 1000;
  await page.addInitScript(`
    window.__e2e_requests = [{
      id: "BID_2",
      address:          "456 Palm Ave",
      city:             "Palm Coast",
      county:           "Flagler",
      zipCode:          "32164",
      homeowner:        "homeowner-test-principal",
      homeownerEmail:   "owner@example.com",
      targetListDate:   BigInt(0),
      desiredSalePrice: [],
      notes:            "",
      bidDeadline:      BigInt(${pastMs}) * 1000000n,
      status:           { Open: null },
      createdAt:        BigInt(0),
    }];
  `);
}

export async function injectProposal(page: Page): Promise<void> {
  await page.addInitScript(`
    window.__e2e_proposals = [{
      id:                    "PROP_1",
      requestId:             "BID_2",
      agentId:               "agent-test-principal",
      agentName:             "Jane Smith",
      agentEmail:            "jane@kw.com",
      agentBrokerage:        "Keller Williams",
      commissionBps:         250,
      cmaSummary:            "Great comps in the area",
      marketingPlan:         "MLS + Zillow + open house",
      estimatedDaysOnMarket: 30,
      estimatedSalePrice:    350000,
      includedServices:      ["MLS Listing", "Professional Photos"],
      validUntil:            BigInt(0),
      coverLetter:           "I know this neighborhood well.",
      status:                { Pending: null },
      createdAt:             BigInt(0),
    }];
  `);
}

export async function injectAcceptedProposal(page: Page): Promise<void> {
  await page.addInitScript(`
    window.__e2e_proposals = [{
      id:                    "PROP_2",
      requestId:             "BID_2",
      agentId:               "agent-test-principal",
      agentName:             "Jane Smith",
      agentEmail:            "jane@kw.com",
      agentBrokerage:        "Keller Williams",
      commissionBps:         250,
      cmaSummary:            "Great comps in the area",
      marketingPlan:         "MLS + Zillow + open house",
      estimatedDaysOnMarket: 30,
      estimatedSalePrice:    350000,
      includedServices:      ["MLS Listing"],
      validUntil:            BigInt(0),
      coverLetter:           "I know this neighborhood well.",
      status:                { Accepted: null },
      createdAt:             BigInt(0),
    }];
  `);
}

// ── Agent profile injection ───────────────────────────────────────────────────

export async function injectAgentProfile(page: Page): Promise<void> {
  await page.addInitScript(`
    window.__e2e_agent_profiles = [{
      id:                   "agent-test-principal",
      name:                 "Jane Smith",
      brokerage:            "Keller Williams",
      licenseNumber:        "SL3123456",
      statesLicensed:       ["FL"],
      county:               "Volusia",
      bio:                  "Top agent in Daytona Beach with 10+ years experience.",
      phone:                "386-555-0100",
      email:                "jane@kw.com",
      avgDaysOnMarket:      22,
      listingsLast12Months: 14,
      isVerified:           true,
      createdAt:            BigInt(0),
      updatedAt:            BigInt(0),
    }];
  `);
}

export async function injectAgentProfileWithReviews(page: Page): Promise<void> {
  const nowNs = BigInt(Date.now()) * 1000000n;
  await page.addInitScript(`
    const nowNs = BigInt(${Date.now()}) * 1000000n;
    window.__e2e_agent_profiles = [{
      id:                   "agent-test-principal",
      name:                 "Jane Smith",
      brokerage:            "Keller Williams",
      licenseNumber:        "SL3123456",
      statesLicensed:       ["FL"],
      county:               "Volusia",
      bio:                  "Top agent in Daytona Beach.",
      phone:                "386-555-0100",
      email:                "jane@kw.com",
      avgDaysOnMarket:      22,
      listingsLast12Months: 14,
      isVerified:           true,
      createdAt:            BigInt(0),
      updatedAt:            BigInt(0),
    }];
    window.__e2e_reviews = [
      { id: "R1", agentId: "agent-test-principal", reviewerPrincipal: "p1", rating: BigInt(5), comment: "Outstanding service!", transactionId: "PROP_1", createdAt: nowNs },
      { id: "R2", agentId: "agent-test-principal", reviewerPrincipal: "p2", rating: BigInt(4), comment: "Very professional.", transactionId: "PROP_2", createdAt: nowNs },
    ];
  `);
}
