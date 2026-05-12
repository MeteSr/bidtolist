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
    statesLicensed: IDL.Vec(IDL.Text), county: IDL.Text, bio: IDL.Text,
    phone: IDL.Text, email: IDL.Text, avgDaysOnMarket: IDL.Nat,
    listingsLast12Months: IDL.Nat, isVerified: IDL.Bool, createdAt: IDL.Int, updatedAt: IDL.Int,
  });
  const AgentReview = IDL.Record({
    id: IDL.Text, agentId: IDL.Principal, reviewerPrincipal: IDL.Principal,
    rating: IDL.Nat, comment: IDL.Text, transactionId: IDL.Text, createdAt: IDL.Int,
  });
  const RegisterArgs = IDL.Record({
    name: IDL.Text, brokerage: IDL.Text, licenseNumber: IDL.Text,
    statesLicensed: IDL.Vec(IDL.Text), county: IDL.Text, bio: IDL.Text,
    phone: IDL.Text, email: IDL.Text,
  });
  const Result = (ok: any) => IDL.Variant({ ok, err: Error });

  return IDL.Service({
    register:             IDL.Func([RegisterArgs], [Result(AgentProfile)], []),
    getMyProfile:         IDL.Func([], [IDL.Opt(AgentProfile)], ["query"]),
    getProfile:           IDL.Func([IDL.Principal], [IDL.Opt(AgentProfile)], ["query"]),
    getAllProfiles:        IDL.Func([], [IDL.Vec(AgentProfile)], ["query"]),
    getProfilesByCounty:  IDL.Func([IDL.Text], [IDL.Vec(AgentProfile)], ["query"]),
    updateProfile:        IDL.Func([RegisterArgs], [Result(AgentProfile)], []),
    addReview:            IDL.Func([IDL.Record({ agentId: IDL.Principal, rating: IDL.Nat, comment: IDL.Text, transactionId: IDL.Text })], [Result(AgentReview)], []),
    getReviews:           IDL.Func([IDL.Principal], [IDL.Vec(AgentReview)], ["query"]),
    metrics:              IDL.Func([], [IDL.Record({ totalAgents: IDL.Nat, verifiedAgents: IDL.Nat, totalReviews: IDL.Nat, isPaused: IDL.Bool })], ["query"]),
  });
};

async function getActor() {
  return Actor.createActor(idlFactory, { agent: await getAgent(), canisterId: CANISTER_ID });
}

const MOCK_PROFILE: any = null;

export async function registerAgent(args: {
  name: string; brokerage: string; licenseNumber: string;
  statesLicensed: string[]; county: string; bio: string; phone: string; email: string;
}) {
  if (!CANISTER_ID) return { ok: { ...args, id: "mock", isVerified: false, avgDaysOnMarket: 0, listingsLast12Months: 0, createdAt: Date.now(), updatedAt: Date.now() } };
  const a = await getActor();
  return a.register(args);
}

export async function getMyAgentProfile(): Promise<any | null> {
  if (!CANISTER_ID) return MOCK_PROFILE;
  const a = await getActor();
  const result = await a.getMyProfile() as any[];
  return result.length > 0 ? result[0] : null;
}

export async function getAllAgentProfiles(): Promise<any[]> {
  if (!CANISTER_ID) return [];
  const a = await getActor();
  return a.getAllProfiles() as Promise<any[]>;
}

export async function getAgentProfilesByCounty(county: string): Promise<any[]> {
  if (!CANISTER_ID) return [];
  const a = await getActor();
  return a.getProfilesByCounty(county) as Promise<any[]>;
}
