import { Actor } from "@icp-sdk/core/agent";
import { getAgent } from "./actor";

const CANISTER_ID = (process.env as any).FEE_CANISTER_ID || "";

export const idlFactory = ({ IDL }: any) => {
  const FeeStatus = IDL.Variant({ Owed: IDL.Null, Invoiced: IDL.Null, Paid: IDL.Null, Waived: IDL.Null });
  const FeeRecord = IDL.Record({
    id: IDL.Text, requestId: IDL.Text, proposalId: IDL.Text,
    agentId: IDL.Principal, homeownerId: IDL.Principal,
    amountCents: IDL.Nat, status: FeeStatus,
    createdAt: IDL.Int, updatedAt: IDL.Int,
  });
  const Error = IDL.Variant({ NotFound: IDL.Null, NotAuthorized: IDL.Null, InvalidInput: IDL.Text });
  const Result = (ok: any) => IDL.Variant({ ok, err: Error });

  return IDL.Service({
    getMyFees:        IDL.Func([], [IDL.Vec(FeeRecord)], ["query"]),
    getAllFees:        IDL.Func([], [Result(IDL.Vec(FeeRecord))], ["query"]),
    getFeesDue:       IDL.Func([], [Result(IDL.Vec(FeeRecord))], ["query"]),
    markFeeInvoiced:  IDL.Func([IDL.Text], [Result(FeeRecord)], []),
    markFeePaid:      IDL.Func([IDL.Text], [Result(FeeRecord)], []),
    waiveFee:         IDL.Func([IDL.Text], [Result(FeeRecord)], []),
    recordFeeOwed:    IDL.Func([IDL.Text, IDL.Text, IDL.Principal, IDL.Principal, IDL.Nat], [], []),
    metrics:          IDL.Func([], [IDL.Record({ totalFees: IDL.Nat, totalOwed: IDL.Nat, totalPaid: IDL.Nat, revenueUSD: IDL.Nat, isPaused: IDL.Bool })], ["query"]),
  });
};

async function getActor() {
  return Actor.createActor(idlFactory, { agent: await getAgent(), canisterId: CANISTER_ID });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type FeeStatus = { Owed: null } | { Invoiced: null } | { Paid: null } | { Waived: null };

export type FeeRecord = {
  id: string; requestId: string; proposalId: string;
  agentId: unknown; homeownerId: unknown;
  amountCents: bigint; status: FeeStatus;
  createdAt: bigint; updatedAt: bigint;
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_FEES: FeeRecord[] = (window as any).__e2e_fees || [];

// ── Service API ───────────────────────────────────────────────────────────────

export async function getMyFees(): Promise<FeeRecord[]> {
  if (!CANISTER_ID) return MOCK_FEES;
  const a = await getActor();
  return a.getMyFees() as Promise<FeeRecord[]>;
}

export async function getAllFees(): Promise<FeeRecord[]> {
  if (!CANISTER_ID) return MOCK_FEES;
  const a = await getActor();
  const result = await a.getAllFees() as any;
  return "ok" in result ? result.ok : [];
}

export async function markFeeInvoiced(feeId: string) {
  if (!CANISTER_ID) {
    const fee = MOCK_FEES.find(f => f.id === feeId);
    if (fee) (fee as any).status = { Invoiced: null };
    return { ok: fee ?? null };
  }
  const a = await getActor();
  return a.markFeeInvoiced(feeId);
}

export async function markFeePaid(feeId: string) {
  if (!CANISTER_ID) {
    const fee = MOCK_FEES.find(f => f.id === feeId);
    if (fee) (fee as any).status = { Paid: null };
    return { ok: fee ?? null };
  }
  const a = await getActor();
  return a.markFeePaid(feeId);
}

export async function waiveFee(feeId: string) {
  if (!CANISTER_ID) {
    const fee = MOCK_FEES.find(f => f.id === feeId);
    if (fee) (fee as any).status = { Waived: null };
    return { ok: fee ?? null };
  }
  const a = await getActor();
  return a.waiveFee(feeId);
}
