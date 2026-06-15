const AGENT_SERVER = import.meta.env.VITE_AGENT_SERVER_URL || "http://localhost:3001";

async function post(path: string, body: object): Promise<void> {
  try {
    await fetch(`${AGENT_SERVER}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Fire-and-forget — email failures must never block the main flow
  }
}

export function notifyNewProposal(requestId: string): void {
  void post("/api/bidtolist/email/new-proposal", { requestId });
}

export function notifyProposalResult(args: {
  agentEmail: string;
  agentName: string;
  city: string;
  won: boolean;
}): void {
  void post("/api/bidtolist/email/proposal-result", args);
}

export function notifyAgentVerified(args: {
  agentEmail: string;
  agentName: string;
}): void {
  void post("/api/bidtolist/email/agent-verified", args);
}

export function notifyNewListing(requestId: string): void {
  void post("/api/bidtolist/email/new-listing", { requestId });
}

export function notifyRevealOpened(requestId: string): void {
  void post("/api/bidtolist/email/reveal-opened", { requestId });
}

export function notifyListingCancelled(args: {
  agentEmail: string;
  agentName: string;
  city: string;
}): void {
  void post("/api/bidtolist/email/listing-cancelled", args);
}
