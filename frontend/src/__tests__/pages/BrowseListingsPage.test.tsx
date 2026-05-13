import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BrowseListingsPage from "../../pages/BrowseListingsPage";

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
  getOpenBidRequests: vi.fn(),
}));

vi.mock("../../services/agent", () => ({
  getMyAgentProfile: vi.fn(),
}));

import * as listingService from "../../services/listing";
import * as agentService from "../../services/agent";

const mockGetOpenBidRequests = listingService.getOpenBidRequests as ReturnType<typeof vi.fn>;
const mockGetMyAgentProfile = agentService.getMyAgentProfile as ReturnType<typeof vi.fn>;

const FUTURE_NS = BigInt(Date.now() + 7 * 24 * 60 * 60 * 1000) * BigInt(1_000_000);

const MOCK_LISTINGS = [
  {
    id: "BID_1", city: "Daytona Beach", county: "Volusia", zipCode: "32118",
    targetListDate: BigInt(0), desiredSalePrice: [], notes: "Nice house",
    bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0),
    proposalCount: BigInt(3),
  },
  {
    id: "BID_2", city: "Palm Coast", county: "Flagler", zipCode: "32137",
    targetListDate: BigInt(0), desiredSalePrice: [BigInt(350_000_00)], notes: "",
    bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0),
    proposalCount: BigInt(7),
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <BrowseListingsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    isAuthenticated: true, principal: "abc", role: "agent",
    isLoading: false, login: vi.fn(), logout: vi.fn(),
  });
  mockGetOpenBidRequests.mockResolvedValue(MOCK_LISTINGS as any);
  mockGetMyAgentProfile.mockResolvedValue({ isVerified: true } as any);
});

describe("BrowseListingsPage — listings display", () => {
  it("renders page heading", async () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /open listings/i })).toBeInTheDocument();
  });

  it("renders listing city and county", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/daytona beach/i)).toBeInTheDocument();
      expect(screen.getByText(/palm coast/i)).toBeInTheDocument();
    });
  });

  it("shows proposal count out of 10 for each listing", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/3 \/ 10/)).toBeInTheDocument();
      expect(screen.getByText(/7 \/ 10/)).toBeInTheDocument();
    });
  });

  it("renders empty state when no listings", async () => {
    mockGetOpenBidRequests.mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no open listings/i)).toBeInTheDocument();
    });
  });

  it("hides full address — shows city/zip only", async () => {
    renderPage();
    await waitFor(() => screen.getByText(/daytona beach/i));
    // Full street address should NOT appear
    expect(screen.queryByText(/123 main/i)).not.toBeInTheDocument();
  });
});

describe("BrowseListingsPage — county filter", () => {
  it("renders county filter buttons: All, Volusia, Flagler", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^volusia$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^flagler$/i })).toBeInTheDocument();
  });

  it("filters to Volusia county only", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/daytona beach/i));
    await user.click(screen.getByRole("button", { name: /^volusia$/i }));
    expect(screen.getByText(/daytona beach/i)).toBeInTheDocument();
    expect(screen.queryByText(/palm coast/i)).not.toBeInTheDocument();
  });

  it("filters to Flagler county only", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/palm coast/i));
    await user.click(screen.getByRole("button", { name: /^flagler$/i }));
    expect(screen.getByText(/palm coast/i)).toBeInTheDocument();
    expect(screen.queryByText(/daytona beach/i)).not.toBeInTheDocument();
  });

  it("shows all listings when All filter selected", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/daytona beach/i));
    await user.click(screen.getByRole("button", { name: /^volusia$/i }));
    await user.click(screen.getByRole("button", { name: /^all$/i }));
    expect(screen.getByText(/daytona beach/i)).toBeInTheDocument();
    expect(screen.getByText(/palm coast/i)).toBeInTheDocument();
  });
});

describe("BrowseListingsPage — verified agent gate", () => {
  it("enables Submit Proposal button for verified agent", async () => {
    mockGetMyAgentProfile.mockResolvedValue({ isVerified: true } as any);
    renderPage();
    await waitFor(() => screen.getAllByRole("button", { name: /submit proposal/i }));
    const btns = screen.getAllByRole("button", { name: /submit proposal/i });
    btns.forEach(btn => expect(btn).not.toBeDisabled());
  });

  it("disables Submit Proposal button for unverified agent", async () => {
    mockGetMyAgentProfile.mockResolvedValue({ isVerified: false } as any);
    renderPage();
    await waitFor(() => screen.getAllByRole("button", { name: /submit proposal/i }));
    const btns = screen.getAllByRole("button", { name: /submit proposal/i });
    btns.forEach(btn => expect(btn).toBeDisabled());
  });

  it("shows tooltip/label explaining disabled state for unverified agent", async () => {
    mockGetMyAgentProfile.mockResolvedValue({ isVerified: false } as any);
    renderPage();
    await waitFor(() => screen.getByText(/verification pending/i));
    expect(screen.getByText(/verification pending/i)).toBeInTheDocument();
  });

  it("disables Submit Proposal when not authenticated", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, principal: null, role: null,
      isLoading: false, login: vi.fn(), logout: vi.fn(),
    });
    mockGetMyAgentProfile.mockResolvedValue(null);
    renderPage();
    await waitFor(() => screen.getAllByRole("button", { name: /submit proposal/i }));
    const btns = screen.getAllByRole("button", { name: /submit proposal/i });
    btns.forEach(btn => expect(btn).toBeDisabled());
  });

  it("navigates to proposal form when verified agent clicks Submit Proposal", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getAllByRole("button", { name: /submit proposal/i }));
    await user.click(screen.getAllByRole("button", { name: /submit proposal/i })[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/agents/propose/BID_1");
  });
});
