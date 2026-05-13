import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProposalFormPage from "../../pages/ProposalFormPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../services/listing", () => ({
  submitProposal: vi.fn(),
}));

vi.mock("../../services/agent", () => ({
  getMyAgentProfile: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import * as listingService from "../../services/listing";
import * as agentService from "../../services/agent";
import toast from "react-hot-toast";

const mockSubmitProposal    = listingService.submitProposal    as ReturnType<typeof vi.fn>;
const mockGetMyAgentProfile = agentService.getMyAgentProfile  as ReturnType<typeof vi.fn>;

const verifiedAgent = {
  isAuthenticated: true, principal: "abc", role: "agent" as const,
  isLoading: false, login: vi.fn(), logout: vi.fn(),
};

function renderPage(requestId = "BID_1") {
  return render(
    <MemoryRouter initialEntries={[`/agents/propose/${requestId}`]}>
      <Routes>
        <Route path="/agents/propose/:requestId" element={<ProposalFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  mockUseAuth.mockReturnValue(verifiedAgent);
  mockGetMyAgentProfile.mockResolvedValue({ isVerified: true });
  mockSubmitProposal.mockResolvedValue({ ok: { id: "PROP_1" } } as any);
});

describe("ProposalFormPage — verification gate", () => {
  it("shows form when agent is verified", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    });
  });

  it("shows blocked state when agent is not verified", async () => {
    mockGetMyAgentProfile.mockResolvedValue({ isVerified: false });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/verification pending/i)).toBeInTheDocument();
    });
  });

  it("does not show form when agent is not verified", async () => {
    mockGetMyAgentProfile.mockResolvedValue({ isVerified: false });
    renderPage();
    await waitFor(() => {
      expect(screen.queryByLabelText(/your name/i)).not.toBeInTheDocument();
    });
  });

  it("shows blocked state when agent profile is null (not registered)", async () => {
    mockGetMyAgentProfile.mockResolvedValue(null);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/verification pending/i)).toBeInTheDocument();
    });
  });
});

describe("ProposalFormPage — form fields", () => {
  it("renders all required form fields", async () => {
    renderPage();
    await waitFor(() => screen.getByLabelText(/your name/i));
    expect(screen.getByLabelText(/brokerage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/commission \(%\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/est\. sale price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/days on market/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cma summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/marketing plan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument();
  });

  it("renders included services toggle buttons", async () => {
    renderPage();
    await waitFor(() => screen.getByLabelText(/your name/i));
    expect(screen.getByRole("button", { name: /mls listing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /virtual tour/i })).toBeInTheDocument();
  });

  it("includes toggled service in submission", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByLabelText(/your name/i));
    await user.click(screen.getByRole("button", { name: /mls listing/i }));
    await user.type(screen.getByLabelText(/your name/i), "Jane Smith");
    await user.type(screen.getByLabelText(/brokerage/i), "KW");
    await user.type(screen.getByLabelText(/est\. sale price/i), "350000");
    await user.click(screen.getByRole("button", { name: /submit sealed proposal/i }));
    await waitFor(() => {
      const call = mockSubmitProposal.mock.calls[0][0];
      expect(call.includedServices).toContain("MLS Listing");
    });
  });
});

describe("ProposalFormPage — submission", () => {
  it("calls submitProposal with correct requestId, name, and brokerage", async () => {
    const user = userEvent.setup();
    renderPage("BID_42");
    await waitFor(() => screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Jane Smith");
    await user.type(screen.getByLabelText(/brokerage/i), "Keller Williams");
    await user.type(screen.getByLabelText(/est\. sale price/i), "350000");
    await user.click(screen.getByRole("button", { name: /submit sealed proposal/i }));
    await waitFor(() => {
      expect(mockSubmitProposal).toHaveBeenCalled();
      const call = mockSubmitProposal.mock.calls[0][0];
      expect(call.requestId).toBe("BID_42");
      expect(call.agentName).toBe("Jane Smith");
      expect(call.agentBrokerage).toBe("Keller Williams");
    });
  });

  it("navigates to /agents/dashboard on success", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Jane Smith");
    await user.type(screen.getByLabelText(/brokerage/i), "KW");
    await user.type(screen.getByLabelText(/est\. sale price/i), "350000");
    await user.click(screen.getByRole("button", { name: /submit sealed proposal/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/agents/dashboard");
    });
  });

  it("shows error toast and does not navigate when canister returns err", async () => {
    mockSubmitProposal.mockResolvedValue({ err: { NotAuthorized: null } } as any);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Jane Smith");
    await user.type(screen.getByLabelText(/brokerage/i), "KW");
    await user.click(screen.getByRole("button", { name: /submit sealed proposal/i }));
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
