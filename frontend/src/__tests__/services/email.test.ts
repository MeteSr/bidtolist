import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { notifyNewProposal, notifyProposalResult, notifyAgentVerified } from "../../services/email";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("notifyNewProposal", () => {
  it("POSTs to /api/email/new-proposal with correct body", async () => {
    notifyNewProposal({
      homeownerEmail: "owner@example.com",
      city: "Daytona Beach",
      county: "Volusia",
      proposalCount: 3,
      deadlineDate: "6/1/2026",
    });
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/email/new-proposal"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("owner@example.com"),
      })
    );
  });

  it("does not throw when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    expect(() => notifyNewProposal({
      homeownerEmail: "owner@example.com", city: "Daytona Beach",
      county: "Volusia", proposalCount: 1, deadlineDate: "6/1/2026",
    })).not.toThrow();
  });
});

describe("notifyProposalResult", () => {
  it("POSTs to /api/email/proposal-result with won=true for winner", async () => {
    notifyProposalResult({
      agentEmail: "agent@kw.com",
      agentName: "Jane Smith",
      city: "Palm Coast",
      county: "Flagler",
      won: true,
    });
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/email/proposal-result"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"won":true'),
      })
    );
  });

  it("POSTs to /api/email/proposal-result with won=false for losers", async () => {
    notifyProposalResult({
      agentEmail: "loser@remax.com",
      agentName: "Bob Jones",
      city: "Daytona Beach",
      county: "Volusia",
      won: false,
    });
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/email/proposal-result"),
      expect.objectContaining({
        body: expect.stringContaining('"won":false'),
      })
    );
  });

  it("does not throw when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    expect(() => notifyProposalResult({
      agentEmail: "agent@kw.com", agentName: "Jane", city: "Daytona", county: "Volusia", won: true,
    })).not.toThrow();
  });
});

describe("notifyAgentVerified", () => {
  it("POSTs to /api/email/agent-verified with agent email and name", async () => {
    notifyAgentVerified({ agentEmail: "jane@kw.com", agentName: "Jane Smith" });
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/email/agent-verified"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("jane@kw.com"),
      })
    );
  });

  it("does not throw when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    expect(() => notifyAgentVerified({ agentEmail: "jane@kw.com", agentName: "Jane" })).not.toThrow();
  });
});
