const EMAIL_SERVER = import.meta.env.VITE_EMAIL_SERVER_URL || "http://localhost:3002";

async function post(path: string, body: object): Promise<void> {
  try {
    await fetch(`${EMAIL_SERVER}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Fire-and-forget — email failures must never block the main flow
  }
}

export function notifyNewProposal(requestId: string): void {
  void post("/api/email/new-proposal", { requestId });
}

export function notifyProposalResult(args: {
  agentEmail: string;
  agentName: string;
  city: string;
  won: boolean;
}): void {
  void post("/api/email/proposal-result", args);
}

export function notifyAgentVerified(args: {
  agentEmail: string;
  agentName: string;
}): void {
  void post("/api/email/agent-verified", args);
}

export function notifyNewListing(requestId: string): void {
  void post("/api/email/new-listing", { requestId });
}
