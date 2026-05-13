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
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import * as agentService from "../../services/agent";
import * as listingService from "../../services/listing";
import toast from "react-hot-toast";

const mockGetAllAgents = agentService.getAllAgentProfiles as ReturnType<typeof vi.fn>;
const mockVerifyAgent = agentService.verifyAgent as ReturnType<typeof vi.fn>;
const mockGetPending = listingService.getPendingVerificationRequests as ReturnType<typeof vi.fn>;
const mockVerifyHomeowner = listingService.verifyHomeowner as ReturnType<typeof vi.fn>;

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

function renderPage() {
  return render(<AdminPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllAgents.mockResolvedValue([UNVERIFIED_AGENT, VERIFIED_AGENT]);
  mockGetPending.mockResolvedValue([PENDING_HOMEOWNER]);
  mockVerifyAgent.mockResolvedValue({ ok: null });
  mockVerifyHomeowner.mockResolvedValue({ ok: null });
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
});
