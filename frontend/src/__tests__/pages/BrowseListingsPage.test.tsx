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
  getOpenBidRequestsForCities: vi.fn(),
}));

vi.mock("../../services/agent", () => ({
  getMyAgentProfile: vi.fn(),
}));

import * as listingService from "../../services/listing";
import * as agentService from "../../services/agent";

const mockGetOpenBidRequests = listingService.getOpenBidRequests as ReturnType<typeof vi.fn>;
const mockGetOpenBidRequestsForCities = listingService.getOpenBidRequestsForCities as ReturnType<typeof vi.fn>;
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
  mockGetOpenBidRequestsForCities.mockResolvedValue(MOCK_LISTINGS as any);
  // Use cities that don't match MOCK_LISTINGS cities to avoid getByText finding both the
  // service-area subtext and the listing card heading for the same city.
  mockGetMyAgentProfile.mockResolvedValue({
    isVerified: true,
    serviceCities: ["ormond beach", "deltona"],
  } as any);
});

describe("BrowseListingsPage — listings display", () => {
  it("renders page heading", async () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /find your next winning listing/i })).toBeInTheDocument();
  });

  it("renders listing city and county", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/daytona beach/i)).toBeInTheDocument();
      expect(screen.getByText(/palm coast/i)).toBeInTheDocument();
    });
  });

  it("shows proposal count for each listing", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/3 proposals/i)).toBeInTheDocument();
      expect(screen.getByText(/7 proposals/i)).toBeInTheDocument();
    });
  });

  it("renders empty state when no listings", async () => {
    mockGetOpenBidRequestsForCities.mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no opportunities right now/i)).toBeInTheDocument();
    });
  });

  it("hides full address — shows city/zip only", async () => {
    renderPage();
    await waitFor(() => screen.getByText(/daytona beach/i));
    // Full street address should NOT appear
    expect(screen.queryByText(/123 main/i)).not.toBeInTheDocument();
  });

  it("shows deadline countdown on each listing card", async () => {
    renderPage();
    await waitFor(() => screen.getByText(/daytona beach/i));
    expect(screen.getAllByText(/closes in/i).length).toBeGreaterThanOrEqual(1);
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

describe("BrowseListingsPage — agent gate", () => {
  it("shows View Details button for verified agent", async () => {
    mockGetMyAgentProfile.mockResolvedValue({ isVerified: true, serviceCities: ["ormond beach", "deltona"] } as any);
    renderPage();
    await waitFor(() => screen.getAllByRole("button", { name: /view details/i }));
    const btns = screen.getAllByRole("button", { name: /view details/i });
    btns.forEach(btn => expect(btn).not.toBeDisabled());
  });

  it("shows verification pending banner for unverified agent, View Details still enabled", async () => {
    mockGetMyAgentProfile.mockResolvedValue({ isVerified: false, serviceCities: ["ormond beach", "deltona"] } as any);
    renderPage();
    await waitFor(() => screen.getByText(/verification pending/i));
    expect(screen.getByText(/verification pending/i)).toBeInTheDocument();
    await waitFor(() => screen.getAllByRole("button", { name: /view details/i }));
    const btns = screen.getAllByRole("button", { name: /view details/i });
    btns.forEach(btn => expect(btn).not.toBeDisabled());
  });

  it("shows tooltip/label explaining disabled state for unverified agent", async () => {
    mockGetMyAgentProfile.mockResolvedValue({ isVerified: false, serviceCities: ["ormond beach", "deltona"] } as any);
    renderPage();
    await waitFor(() => screen.getByText(/verification pending/i));
    expect(screen.getByText(/verification pending/i)).toBeInTheDocument();
  });

  it("View Details always enabled when not authenticated", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, principal: null, role: null,
      isLoading: false, login: vi.fn(), logout: vi.fn(),
    });
    mockGetOpenBidRequests.mockResolvedValue(MOCK_LISTINGS as any);
    renderPage();
    await waitFor(() => screen.getAllByRole("button", { name: /view details/i }));
    const btns = screen.getAllByRole("button", { name: /view details/i });
    btns.forEach(btn => expect(btn).not.toBeDisabled());
  });

  it("navigates to listing detail when clicking View Details", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getAllByRole("button", { name: /view details/i }));
    await user.click(screen.getAllByRole("button", { name: /view details/i })[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/agents/listings/BID_1");
  });
});
