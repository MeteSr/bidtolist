import { Actor } from "@icp-sdk/core/agent";
import { getAgent } from "./actor";

const CANISTER_ID = (process.env as any).LISTING_CANISTER_ID || "";

export const idlFactory = ({ IDL }: any) => {
  const Error = IDL.Variant({
    NotFound: IDL.Null,
    NotAuthorized: IDL.Null,
    InvalidInput: IDL.Text,
    AlreadyCancelled: IDL.Null,
    DeadlinePassed: IDL.Null,
  });
  const BidRequestStatus = IDL.Variant({ Open: IDL.Null, Awarded: IDL.Null, Cancelled: IDL.Null });
  const ProposalStatus   = IDL.Variant({ Pending: IDL.Null, Accepted: IDL.Null, Rejected: IDL.Null, Withdrawn: IDL.Null });

  const BidRequestSummary = IDL.Record({
    id: IDL.Text, city: IDL.Text, county: IDL.Text, zipCode: IDL.Text,
    targetListDate: IDL.Int, desiredSalePrice: IDL.Opt(IDL.Nat),
    notes: IDL.Text, bidDeadline: IDL.Int, status: BidRequestStatus,
    createdAt: IDL.Int, proposalCount: IDL.Nat,
  });
  const ListingBidRequest = IDL.Record({
    id: IDL.Text, address: IDL.Text, city: IDL.Text, county: IDL.Text, zipCode: IDL.Text,
    homeowner: IDL.Principal, homeownerEmail: IDL.Text, targetListDate: IDL.Int,
    desiredSalePrice: IDL.Opt(IDL.Nat), notes: IDL.Text, bidDeadline: IDL.Int,
    status: BidRequestStatus, createdAt: IDL.Int,
  });
  const ListingProposal = IDL.Record({
    id: IDL.Text, requestId: IDL.Text, agentId: IDL.Principal, agentName: IDL.Text,
    agentEmail: IDL.Text, agentBrokerage: IDL.Text, commissionBps: IDL.Nat,
    cmaSummary: IDL.Text, marketingPlan: IDL.Text, estimatedDaysOnMarket: IDL.Nat,
    estimatedSalePrice: IDL.Nat, includedServices: IDL.Vec(IDL.Text), validUntil: IDL.Int,
    coverLetter: IDL.Text, status: ProposalStatus, createdAt: IDL.Int,
  });
  const HomeownerVerificationRequest = IDL.Record({
    id: IDL.Text, principal: IDL.Principal, address: IDL.Text,
    parcelNumber: IDL.Text, contactEmail: IDL.Text, submittedAt: IDL.Int,
  });
  const Result = (ok: any) => IDL.Variant({ ok, err: Error });

  return IDL.Service({
    createBidRequest:                IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Int, IDL.Opt(IDL.Nat), IDL.Text, IDL.Int, IDL.Text], [Result(ListingBidRequest)], []),
    getMyBidRequests:                IDL.Func([], [IDL.Vec(ListingBidRequest)], ["query"]),
    getBidRequest:                   IDL.Func([IDL.Text], [Result(ListingBidRequest)], ["query"]),
    cancelBidRequest:                IDL.Func([IDL.Text], [Result(IDL.Null)], []),
    getOpenBidRequests:              IDL.Func([], [IDL.Vec(BidRequestSummary)], ["query"]),
    submitProposal:                  IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Text, IDL.Text, IDL.Nat, IDL.Nat, IDL.Vec(IDL.Text), IDL.Int, IDL.Text], [Result(ListingProposal)], []),
    getProposalsForRequest:          IDL.Func([IDL.Text], [IDL.Vec(ListingProposal)], ["query"]),
    getMyProposals:                  IDL.Func([], [IDL.Vec(ListingProposal)], ["query"]),
    acceptProposal:                  IDL.Func([IDL.Text], [Result(IDL.Null)], []),
    requestHomeownerVerification:    IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result(HomeownerVerificationRequest)], []),
    isHomeownerVerified:             IDL.Func([], [IDL.Bool], ["query"]),
    getPendingVerificationRequests:  IDL.Func([], [IDL.Vec(HomeownerVerificationRequest)], ["query"]),
    verifyHomeowner:                 IDL.Func([IDL.Principal], [Result(IDL.Null)], []),
    revokeHomeowner:                 IDL.Func([IDL.Principal], [Result(IDL.Null)], []),
    setAgentCanisterId:              IDL.Func([IDL.Text], [Result(IDL.Null)], []),
    metrics:                         IDL.Func([], [IDL.Record({ totalRequests: IDL.Nat, openRequests: IDL.Nat, awardedRequests: IDL.Nat, totalProposals: IDL.Nat, isPaused: IDL.Bool })], ["query"]),
  });
};

async function getActor() {
  return Actor.createActor(idlFactory, { agent: await getAgent(), canisterId: CANISTER_ID });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type BidRequestSummary = {
  id: string; city: string; county: string; zipCode: string;
  targetListDate: bigint; desiredSalePrice: [] | [bigint];
  notes: string; bidDeadline: bigint; status: { Open: null } | { Awarded: null } | { Cancelled: null };
  createdAt: bigint; proposalCount: bigint;
};

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REQUESTS: any[] = [];
const MOCK_PROPOSALS: any[] = [];

// ── Service API ──────────────────────────────────────────────────────────────

export async function createBidRequest(args: {
  address: string; city: string; county: string; zipCode: string;
  targetListDate: number; desiredSalePrice?: number; notes: string; bidDeadline: number;
  homeownerEmail: string;
}) {
  if (!CANISTER_ID) {
    const req = { id: `BID_${Date.now()}`, ...args, homeowner: "mock", status: { Open: null }, createdAt: Date.now() };
    MOCK_REQUESTS.push(req);
    return { ok: req };
  }
  const a = await getActor();
  return a.createBidRequest(
    args.address, args.city, args.county, args.zipCode,
    BigInt(args.targetListDate), args.desiredSalePrice ? [args.desiredSalePrice] : [],
    args.notes, BigInt(args.bidDeadline), args.homeownerEmail
  );
}

export async function getBidRequest(requestId: string) {
  if (!CANISTER_ID) {
    const req = MOCK_REQUESTS.find((r: any) => r.id === requestId);
    return req ? { ok: req } : { err: { NotFound: null } };
  }
  const a = await getActor();
  return a.getBidRequest(requestId);
}

export async function getMyBidRequests(): Promise<any[]> {
  if (!CANISTER_ID) return MOCK_REQUESTS;
  const a = await getActor();
  return a.getMyBidRequests() as Promise<any[]>;
}

export async function getOpenBidRequests(): Promise<BidRequestSummary[]> {
  if (!CANISTER_ID) {
    return MOCK_REQUESTS
      .filter((r: any) => r.status?.Open !== undefined)
      .map((r: any) => ({
        ...r,
        proposalCount: BigInt(MOCK_PROPOSALS.filter((p: any) => p.requestId === r.id).length),
      }));
  }
  const a = await getActor();
  return a.getOpenBidRequests() as Promise<BidRequestSummary[]>;
}

export async function submitProposal(args: {
  requestId: string; agentName: string; agentEmail: string; agentBrokerage: string;
  commissionBps: number; cmaSummary: string; marketingPlan: string;
  estimatedDaysOnMarket: number; estimatedSalePrice: number; includedServices: string[];
  validUntil: number; coverLetter: string;
}) {
  if (!CANISTER_ID) {
    const p = { id: `PROP_${Date.now()}`, ...args, agentId: "mock", status: { Pending: null }, createdAt: Date.now() };
    MOCK_PROPOSALS.push(p);
    return { ok: p };
  }
  const a = await getActor();
  return a.submitProposal(
    args.requestId, args.agentName, args.agentEmail, args.agentBrokerage, args.commissionBps,
    args.cmaSummary, args.marketingPlan, args.estimatedDaysOnMarket,
    args.estimatedSalePrice, args.includedServices, BigInt(args.validUntil), args.coverLetter
  );
}

export async function getProposalsForRequest(requestId: string): Promise<any[]> {
  if (!CANISTER_ID) return MOCK_PROPOSALS.filter((p: any) => p.requestId === requestId);
  const a = await getActor();
  return a.getProposalsForRequest(requestId) as Promise<any[]>;
}

export async function getMyProposals(): Promise<any[]> {
  if (!CANISTER_ID) return MOCK_PROPOSALS;
  const a = await getActor();
  return a.getMyProposals() as Promise<any[]>;
}

export async function acceptProposal(proposalId: string) {
  if (!CANISTER_ID) return { ok: null };
  const a = await getActor();
  return a.acceptProposal(proposalId);
}

export async function requestHomeownerVerification(address: string, parcelNumber: string, contactEmail: string) {
  if (!CANISTER_ID) return { ok: { id: "VER_mock", principal: "mock", address, parcelNumber, contactEmail, submittedAt: BigInt(Date.now()) } };
  const a = await getActor();
  return a.requestHomeownerVerification(address, parcelNumber, contactEmail);
}

export async function isHomeownerVerified(): Promise<boolean> {
  if (!CANISTER_ID) return false;
  const a = await getActor();
  return a.isHomeownerVerified() as Promise<boolean>;
}

export async function getPendingVerificationRequests(): Promise<any[]> {
  if (!CANISTER_ID) return [];
  const a = await getActor();
  return a.getPendingVerificationRequests() as Promise<any[]>;
}

export async function verifyHomeowner(principal: string) {
  if (!CANISTER_ID) return { ok: null };
  const a = await getActor();
  const { Principal } = await import("@dfinity/principal");
  return a.verifyHomeowner(Principal.fromText(principal));
}

export async function revokeHomeowner(principal: string) {
  if (!CANISTER_ID) return { ok: null };
  const a = await getActor();
  const { Principal } = await import("@dfinity/principal");
  return a.revokeHomeowner(Principal.fromText(principal));
}

export async function getListingMetrics(): Promise<{ totalRequests: number; openRequests: number; awardedRequests: number; totalProposals: number }> {
  if (!CANISTER_ID) return { totalRequests: 0, openRequests: 0, awardedRequests: 0, totalProposals: 0 };
  const a = await getActor();
  const m = await a.metrics() as any;
  return {
    totalRequests:   Number(m.totalRequests),
    openRequests:    Number(m.openRequests),
    awardedRequests: Number(m.awardedRequests),
    totalProposals:  Number(m.totalProposals),
  };
}
