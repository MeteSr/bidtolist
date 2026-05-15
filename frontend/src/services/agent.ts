import { Actor } from "@icp-sdk/core/agent";
import { getAgent } from "./actor";

const CANISTER_ID = (process.env as any).AGENT_CANISTER_ID || "";

export const idlFactory = ({ IDL }: any) => {
  const Error = IDL.Variant({
    NotFound: IDL.Null, AlreadyExists: IDL.Null, NotAuthorized: IDL.Null,
    Paused: IDL.Null, RateLimitExceeded: IDL.Null, DuplicateReview: IDL.Null,
    InvalidInput: IDL.Text,
  });
  const AgentProfile = IDL.Record({
    id: IDL.Principal, name: IDL.Text, brokerage: IDL.Text, licenseNumber: IDL.Text,
    licenseState: IDL.Text, statesLicensed: IDL.Vec(IDL.Text), county: IDL.Text,
    serviceCities: IDL.Vec(IDL.Text), bio: IDL.Text,
    phone: IDL.Text, email: IDL.Text, avgDaysOnMarket: IDL.Nat,
    listingsLast12Months: IDL.Nat, isVerified: IDL.Bool, createdAt: IDL.Int, updatedAt: IDL.Int,
  });
  const AgentDocs = IDL.Record({
    photoIdDoc: IDL.Vec(IDL.Nat8),
    licenseDoc:  IDL.Vec(IDL.Nat8),
  });
  const AgentReview = IDL.Record({
    id: IDL.Text, agentId: IDL.Principal, reviewerPrincipal: IDL.Principal,
    rating: IDL.Nat, comment: IDL.Text, transactionId: IDL.Text, createdAt: IDL.Int,
  });
  const RegisterArgs = IDL.Record({
    name: IDL.Text, brokerage: IDL.Text, licenseNumber: IDL.Text,
    licenseState: IDL.Text, statesLicensed: IDL.Vec(IDL.Text),
    county: IDL.Text, serviceCities: IDL.Vec(IDL.Text), bio: IDL.Text,
    phone: IDL.Text, email: IDL.Text,
    photoIdDoc: IDL.Vec(IDL.Nat8),
    licenseDoc:  IDL.Vec(IDL.Nat8),
  });
  const Result = (ok: any) => IDL.Variant({ ok, err: Error });

  return IDL.Service({
    register:             IDL.Func([RegisterArgs], [Result(AgentProfile)], []),
    getMyProfile:         IDL.Func([], [IDL.Opt(AgentProfile)], ["query"]),
    getProfile:           IDL.Func([IDL.Principal], [IDL.Opt(AgentProfile)], ["query"]),
    getAllProfiles:        IDL.Func([], [IDL.Vec(AgentProfile)], ["query"]),
    getProfilesByCounty:  IDL.Func([IDL.Text], [IDL.Vec(AgentProfile)], ["query"]),
    getAgentsForCity:     IDL.Func([IDL.Text, IDL.Nat], [IDL.Vec(AgentProfile)], ["query"]),
    updateProfile:        IDL.Func([RegisterArgs], [Result(AgentProfile)], []),
    addReview:            IDL.Func([IDL.Record({ agentId: IDL.Principal, rating: IDL.Nat, comment: IDL.Text, transactionId: IDL.Text })], [Result(AgentReview)], []),
    getReviews:           IDL.Func([IDL.Principal], [IDL.Vec(AgentReview)], ["query"]),
    isVerifiedAgent:      IDL.Func([IDL.Principal], [IDL.Bool], ["query"]),
    verifyAgent:          IDL.Func([IDL.Principal], [Result(IDL.Null)], []),
    getAgentDocs:         IDL.Func([IDL.Principal], [Result(AgentDocs)], []),
    metrics:              IDL.Func([], [IDL.Record({ totalAgents: IDL.Nat, verifiedAgents: IDL.Nat, totalReviews: IDL.Nat, isPaused: IDL.Bool })], ["query"]),
  });
};

async function getActor() {
  return Actor.createActor(idlFactory, { agent: await getAgent(), canisterId: CANISTER_ID });
}

export async function registerAgent(args: {
  name: string; brokerage: string; licenseNumber: string;
  licenseState: string; statesLicensed: string[]; county: string;
  serviceCities: string[]; bio: string; phone: string; email: string;
  photoIdDoc: Uint8Array; licenseDoc: Uint8Array;
}) {
  if (!CANISTER_ID) return { ok: { ...args, id: "mock", isVerified: false, avgDaysOnMarket: 0, listingsLast12Months: 0, createdAt: Date.now(), updatedAt: Date.now() } };
  const a = await getActor();
  return a.register(args);
}

export async function getMyAgentProfile(): Promise<any | null> {
  if (!CANISTER_ID) return (typeof window !== "undefined" && (window as any).__e2e_agent_profile) ?? null;
  const a = await getActor();
  const result = await a.getMyProfile() as any[];
  return result.length > 0 ? result[0] : null;
}

export async function getAllAgentProfiles(): Promise<any[]> {
  if (!CANISTER_ID) return (typeof window !== "undefined" && (window as any).__e2e_agent_profiles) || [];
  const a = await getActor();
  return a.getAllProfiles() as Promise<any[]>;
}

export async function getAgentProfilesByCounty(county: string): Promise<any[]> {
  if (!CANISTER_ID) return [];
  const a = await getActor();
  return a.getProfilesByCounty(county) as Promise<any[]>;
}

export async function updateAgentProfile(args: {
  name: string; brokerage: string; licenseNumber: string;
  licenseState: string; statesLicensed: string[]; county: string;
  serviceCities: string[]; bio: string; phone: string; email: string;
}) {
  if (!CANISTER_ID) return { ok: { ...args, id: "mock", isVerified: false, avgDaysOnMarket: 0, listingsLast12Months: 0, createdAt: Date.now(), updatedAt: Date.now() } };
  const a = await getActor();
  return a.updateProfile(args);
}

export async function getAgentsForCity(city: string, limit: number): Promise<any[]> {
  if (!CANISTER_ID) return [];
  const a = await getActor();
  return a.getAgentsForCity(city, limit) as Promise<any[]>;
}

export async function isVerifiedAgent(principal: string): Promise<boolean> {
  if (!CANISTER_ID) return false;
  const a = await getActor();
  const { Principal } = await import("@dfinity/principal");
  return a.isVerifiedAgent(Principal.fromText(principal)) as Promise<boolean>;
}

export async function verifyAgent(agentId: string) {
  if (!CANISTER_ID) return { ok: null };
  const a = await getActor();
  const { Principal } = await import("@dfinity/principal");
  return a.verifyAgent(Principal.fromText(agentId));
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export type AgentReview = {
  id: string; agentId: unknown; reviewerPrincipal: unknown;
  rating: bigint; comment: string; transactionId: string; createdAt: bigint;
};

function mockReviews(): AgentReview[] { return (typeof window !== "undefined" && (window as any).__e2e_reviews) || []; }

export async function addReview(args: {
  agentId: string; rating: number; comment: string; transactionId: string;
}) {
  if (!CANISTER_ID) {
    const reviews = mockReviews();
    const existing = reviews.find(r => (r as any).agentId === args.agentId && r.transactionId === args.transactionId);
    if (existing) return { err: { DuplicateReview: null } };
    if (!(window as any).__e2e_reviews) (window as any).__e2e_reviews = [];
    const review: any = {
      id: `AGREV_${Date.now()}`, agentId: args.agentId, reviewerPrincipal: "mock",
      rating: BigInt(args.rating), comment: args.comment, transactionId: args.transactionId,
      createdAt: BigInt(Date.now()),
    };
    (window as any).__e2e_reviews.push(review);
    return { ok: review };
  }
  const a = await getActor();
  const { Principal } = await import("@dfinity/principal");
  return a.addReview({
    agentId: Principal.fromText(args.agentId),
    rating: BigInt(args.rating),
    comment: args.comment,
    transactionId: args.transactionId,
  });
}

export async function getReviews(agentId: string): Promise<AgentReview[]> {
  if (!CANISTER_ID) return mockReviews().filter(r => (r as any).agentId === agentId);
  const a = await getActor();
  const { Principal } = await import("@dfinity/principal");
  return a.getReviews(Principal.fromText(agentId)) as Promise<AgentReview[]>;
}

export async function getAgentProfile(agentId: string): Promise<any | null> {
  if (!CANISTER_ID) {
    const profiles: any[] = (typeof window !== "undefined" && (window as any).__e2e_agent_profiles) || [];
    return profiles.find((p: any) => p.id === agentId) ?? null;
  }
  const a = await getActor();
  const { Principal } = await import("@dfinity/principal");
  const result = await a.getProfile(Principal.fromText(agentId)) as any[];
  return result.length > 0 ? result[0] : null;
}
