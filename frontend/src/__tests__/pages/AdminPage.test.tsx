import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AdminPage from "../../pages/AdminPage";

vi.mock("../../services/agent", () => ({
  getAllAgentProfiles: vi.fn(),
  verifyAgent: vi.fn(),
}));
vi.mock("../../services/listing", () => ({
  getPendingVerificationRequests: vi.fn(),
  verifyHomeowner: vi.fn(),
}));
vi.mock("../../services/fee", () => ({
  getAllFees:       vi.fn(),
  markFeeInvoiced: vi.fn(),
  markFeePaid:     vi.fn(),
  waiveFee:        vi.fn(),
}));
vi.mock("../../services/email", () => ({
  notifyAgentVerified: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import * as agentService from "../../services/agent";
import * as listingService from "../../services/listing";
import * as feeService from "../../services/fee";
import * as emailService from "../../services/email";
import toast from "react-hot-toast";

const mockNotifyAgentVerified = emailService.notifyAgentVerified as ReturnType<typeof vi.fn>;
const mockGetAllAgents        = agentService.getAllAgentProfiles as ReturnType<typeof vi.fn>;
const mockVerifyAgent         = agentService.verifyAgent as ReturnType<typeof vi.fn>;
const mockGetPending          = listingService.getPendingVerificationRequests as ReturnType<typeof vi.fn>;
const mockVerifyHomeowner     = listingService.verifyHomeowner as ReturnType<typeof vi.fn>;
const mockGetAllFees          = feeService.getAllFees as ReturnType<typeof vi.fn>;
const mockMarkFeeInvoiced     = feeService.markFeeInvoiced as ReturnType<typeof vi.fn>;
const mockMarkFeePaid         = feeService.markFeePaid as ReturnType<typeof vi.fn>;
const mockWaiveFee            = feeService.waiveFee as ReturnType<typeof vi.fn>;

const UNVERIFIED_AGENT = {
  id: "principal-1", name: "Jane Smith", brokerage: "KW Realty",
  licenseNumber: "SL3123456", county: "Volusia", email: "jane@kw.com",
  isVerified: false,
};
const VERIFIED_AGENT = {
  id: "principal-2", name: "Bob Jones", brokerage: "RE/MAX",
  licenseNumber: "SL3999999", county: "Flagler", email: "bob@remax.com",
  isVerified: true,
};
const PENDING_HOMEOWNER = {
  id: "VER_1", principal: "principal-3", address: "123 Oak St",
  parcelNumber: "7001-00-00-0010", contactEmail: "owner@example.com",
  submittedAt: BigInt(Date.now()),
};
const FEE_OWED: any = {
  id: "FEE_1", requestId: "BID_1", proposalId: "PROP_1",
  agentId: "principal-1", homeownerId: "principal-2",
  amountCents: BigInt(29500), status: { Owed: null },
  createdAt: BigInt(Date.now() * 1_000_000), updatedAt: BigInt(0),
};
const FEE_PAID: any = {
  ...FEE_OWED, id: "FEE_2", proposalId: "PROP_2",
  amountCents: BigInt(29500), status: { Paid: null },
};

function renderPage() {
  return render(<AdminPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllAgents.mockResolvedValue([UNVERIFIED_AGENT, VERIFIED_AGENT]);
  mockGetPending.mockResolvedValue([PENDING_HOMEOWNER]);
  mockGetAllFees.mockResolvedValue([]);
  mockVerifyAgent.mockResolvedValue({ ok: null });
  mockVerifyHomeowner.mockResolvedValue({ ok: null });
  mockMarkFeeInvoiced.mockResolvedValue({ ok: null });
  mockMarkFeePaid.mockResolvedValue({ ok: null });
  mockWaiveFee.mockResolvedValue({ ok: null });
});

describe("AdminPage", () => {
  it("renders heading", async () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /admin/i })).toBeDefined();
  });

  it("shows unverified agents section", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeDefined());
    expect(screen.getByText(/SL3123456/)).toBeDefined();
  });

  it("does not show verified agents in unverified list", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeDefined());
    expect(screen.queryByText("Bob Jones")).toBeNull();
  });

  it("shows pending homeowner verifications", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/123 Oak St/i)).toBeDefined());
    expect(screen.getByText(/7001-00-00-0010/)).toBeDefined();
  });

  it("shows DBPR lookup link", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeDefined());
    expect(screen.getByRole("link", { name: /dbpr/i })).toBeDefined();
  });

  it("calls verifyAgent on Verify button click", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeDefined());
    const btns = screen.getAllByRole("button", { name: /verify agent/i });
    fireEvent.click(btns[0]);
    await waitFor(() => expect(mockVerifyAgent).toHaveBeenCalledWith("principal-1"));
  });

  it("shows success toast after verifying agent", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeDefined());
    fireEvent.click(screen.getAllByRole("button", { name: /verify agent/i })[0]);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("removes agent from list after verification", async () => {
    mockGetAllAgents
      .mockResolvedValueOnce([UNVERIFIED_AGENT, VERIFIED_AGENT])
      .mockResolvedValueOnce([VERIFIED_AGENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeDefined());
    fireEvent.click(screen.getAllByRole("button", { name: /verify agent/i })[0]);
    await waitFor(() => expect(screen.queryByText("Jane Smith")).toBeNull());
  });

  it("calls verifyHomeowner on Verify Homeowner button click", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/123 Oak St/i)).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: /verify homeowner/i }));
    await waitFor(() => expect(mockVerifyHomeowner).toHaveBeenCalledWith("principal-3"));
  });

  it("shows success toast after verifying homeowner", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/123 Oak St/i)).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: /verify homeowner/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("shows error toast when verifyAgent fails", async () => {
    mockVerifyAgent.mockResolvedValue({ err: { NotAuthorized: null } });
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeDefined());
    fireEvent.click(screen.getAllByRole("button", { name: /verify agent/i })[0]);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it("fires notifyAgentVerified with agent email and name after verification", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeDefined());
    fireEvent.click(screen.getAllByRole("button", { name: /verify agent/i })[0]);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mockNotifyAgentVerified).toHaveBeenCalledWith({
      agentEmail: "jane@kw.com",
      agentName: "Jane Smith",
    });
  });

  it("does not fire notifyAgentVerified when verifyAgent fails", async () => {
    mockVerifyAgent.mockResolvedValue({ err: { NotAuthorized: null } });
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeDefined());
    fireEvent.click(screen.getAllByRole("button", { name: /verify agent/i })[0]);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(mockNotifyAgentVerified).not.toHaveBeenCalled();
  });

  it("shows empty state when no unverified agents", async () => {
    mockGetAllAgents.mockResolvedValue([VERIFIED_AGENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/no pending agent/i)).toBeDefined());
  });

  it("shows empty state when no pending homeowners", async () => {
    mockGetPending.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/no pending homeowner/i)).toBeDefined());
  });

  // ── Fee dashboard tests ────────────────────────────────────────────────────

  it("shows empty fee state when no fees", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/no fee records yet/i)).toBeDefined());
  });

  it("shows revenue summary stats", async () => {
    mockGetAllFees.mockResolvedValue([FEE_OWED, FEE_PAID]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("fee-stat-owed")).toBeInTheDocument();
      expect(screen.getByTestId("fee-stat-paid")).toBeInTheDocument();
      expect(screen.getByTestId("fee-stat-waived")).toBeInTheDocument();
    });
  });

  it("shows correct outstanding amount for Owed fee", async () => {
    mockGetAllFees.mockResolvedValue([FEE_OWED]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("fee-stat-owed")).toHaveTextContent("$295.00");
    });
  });

  it("shows correct paid amount for Paid fee", async () => {
    mockGetAllFees.mockResolvedValue([FEE_PAID]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("fee-stat-paid")).toHaveTextContent("$295.00");
    });
  });

  it("shows Owed status badge for owed fee", async () => {
    mockGetAllFees.mockResolvedValue([FEE_OWED]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("fee-status-FEE_1")).toHaveTextContent(/owed/i);
    });
  });

  it("shows Paid status badge for paid fee", async () => {
    mockGetAllFees.mockResolvedValue([FEE_PAID]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("fee-status-FEE_2")).toHaveTextContent(/paid/i);
    });
  });

  it("shows Mark Invoiced and Mark Paid buttons for Owed fee", async () => {
    mockGetAllFees.mockResolvedValue([FEE_OWED]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("fee-invoice-FEE_1")).toBeInTheDocument();
      expect(screen.getByTestId("fee-paid-FEE_1")).toBeInTheDocument();
    });
  });

  it("calls markFeeInvoiced when Mark Invoiced is clicked", async () => {
    mockGetAllFees.mockResolvedValue([FEE_OWED]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId("fee-invoice-FEE_1")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("fee-invoice-FEE_1"));
    await waitFor(() => expect(mockMarkFeeInvoiced).toHaveBeenCalledWith("FEE_1"));
  });

  it("calls markFeePaid when Mark Paid is clicked", async () => {
    mockGetAllFees.mockResolvedValue([FEE_OWED]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId("fee-paid-FEE_1")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("fee-paid-FEE_1"));
    await waitFor(() => expect(mockMarkFeePaid).toHaveBeenCalledWith("FEE_1"));
  });

  it("calls waiveFee when Waive is clicked", async () => {
    mockGetAllFees.mockResolvedValue([FEE_OWED]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId("fee-waive-FEE_1")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("fee-waive-FEE_1"));
    await waitFor(() => expect(mockWaiveFee).toHaveBeenCalledWith("FEE_1"));
  });

  it("shows success toast after fee action", async () => {
    mockGetAllFees.mockResolvedValue([FEE_OWED]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId("fee-paid-FEE_1")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("fee-paid-FEE_1"));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("does not show Mark Invoiced/Waive buttons for Paid fee", async () => {
    mockGetAllFees.mockResolvedValue([FEE_PAID]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId("fee-status-FEE_2")).toBeInTheDocument());
    expect(screen.queryByTestId("fee-invoice-FEE_2")).toBeNull();
    expect(screen.queryByTestId("fee-paid-FEE_2")).toBeNull();
    expect(screen.queryByTestId("fee-waive-FEE_2")).toBeNull();
  });
});
