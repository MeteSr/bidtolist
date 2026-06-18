import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { notifyNewProposal, notifyProposalResult, notifyAgentVerified, notifyRevealOpened, notifyListingCancelled } from "../../services/email";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("notifyNewProposal", () => {
  it("POSTs to /api/bidtolist/email/new-proposal with requestId", async () => {
    notifyNewProposal("REQ_abc123");
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/bidtolist/email/new-proposal"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("REQ_abc123"),
      })
    );
  });

  it("does not throw when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    expect(() => notifyNewProposal("REQ_abc123")).not.toThrow();
  });
});

describe("notifyProposalResult", () => {
  it("POSTs to /api/bidtolist/email/proposal-result with won=true for winner", async () => {
    notifyProposalResult({
      agentEmail: "agent@kw.com",
      agentName: "Jane Smith",
      city: "Palm Coast",
      won: true,
    });
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/bidtolist/email/proposal-result"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"won":true'),
      })
    );
  });

  it("POSTs to /api/bidtolist/email/proposal-result with won=false for losers", async () => {
    notifyProposalResult({
      agentEmail: "loser@remax.com",
      agentName: "Bob Jones",
      city: "Daytona Beach",
      won: false,
    });
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/bidtolist/email/proposal-result"),
      expect.objectContaining({
        body: expect.stringContaining('"won":false'),
      })
    );
  });

  it("does not throw when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    expect(() => notifyProposalResult({
      agentEmail: "agent@kw.com", agentName: "Jane", city: "Daytona", won: true,
    })).not.toThrow();
  });
});

describe("notifyAgentVerified", () => {
  it("POSTs to /api/bidtolist/email/agent-verified with agent email and name", async () => {
    notifyAgentVerified({ agentEmail: "jane@kw.com", agentName: "Jane Smith" });
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/bidtolist/email/agent-verified"),
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

describe("notifyRevealOpened", () => {
  it("POSTs to /api/bidtolist/email/reveal-opened with requestId", async () => {
    notifyRevealOpened("BID_reveal_123");
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/bidtolist/email/reveal-opened"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("BID_reveal_123"),
      })
    );
  });

  it("does not throw when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    expect(() => notifyRevealOpened("BID_reveal_123")).not.toThrow();
  });
});

describe("notifyListingCancelled", () => {
  it("POSTs to /api/bidtolist/email/listing-cancelled with agent details", async () => {
    notifyListingCancelled({ agentEmail: "bob@remax.com", agentName: "Bob Jones", city: "Palm Coast" });
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/bidtolist/email/listing-cancelled"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("bob@remax.com"),
      })
    );
  });

  it("includes city in the request body", async () => {
    notifyListingCancelled({ agentEmail: "bob@remax.com", agentName: "Bob Jones", city: "Palm Coast" });
    await new Promise(r => setTimeout(r, 0));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ body: expect.stringContaining("Palm Coast") })
    );
  });

  it("does not throw when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    expect(() => notifyListingCancelled({ agentEmail: "bob@remax.com", agentName: "Bob", city: "Daytona Beach" })).not.toThrow();
  });
});
