/**
 * Integration tests for BrowseListingsPage.
 * Unlike unit tests, these do NOT mock the service layer — the real service
 * functions run and use their !CANISTER_ID fallback, reading live from
 * window.__e2e_requests at call time.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BrowseListingsPage from "../../pages/BrowseListingsPage";

// ── Only mock auth and navigation — services use real fallback ─────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const FUTURE_NS = BigInt(Date.now() + 7 * 24 * 60 * 60 * 1000) * BigInt(1_000_000);

function renderPage() {
  return render(
    <MemoryRouter>
      <BrowseListingsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  delete (window as any).__e2e_requests;
  delete (window as any).__e2e_proposals;
  mockUseAuth.mockReturnValue({
    isAuthenticated: false, principal: null, role: null,
    isLoading: false, login: vi.fn(), logout: vi.fn(),
  });
});

afterEach(() => {
  delete (window as any).__e2e_requests;
  delete (window as any).__e2e_proposals;
});

describe("BrowseListingsPage — integration (real service, mock fallback)", () => {
  it("shows empty state when no requests are injected", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no opportunities right now/i)).toBeInTheDocument();
    });
  });

  it("shows listing cards for injected open requests", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_INT_1", address: "100 Oak St", city: "Daytona Beach", county: "Volusia",
        zipCode: "32118", homeowner: "owner-principal", homeownerEmail: "owner@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "Corner lot",
        bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    renderPage();
    await waitFor(() => {
      // "Daytona Beach, Volusia County · 32118" — unique to the listing card
      expect(screen.getByText(/daytona beach/i)).toBeInTheDocument();
    });
    // Listing card contains "Volusia County" (filter button is just "Volusia")
    expect(screen.getByText(/volusia county/i)).toBeInTheDocument();
  });

  it("shows bid countdown for open listing", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_INT_2", address: "200 Palm Ave", city: "Palm Coast", county: "Flagler",
        zipCode: "32164", homeowner: "owner-principal", homeownerEmail: "owner@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/closes in/i)).toBeInTheDocument();
    });
  });

  it("county filter hides listings from other counties", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_INT_3", address: "10 A St", city: "Daytona Beach", county: "Volusia",
        zipCode: "32118", homeowner: "p1", homeownerEmail: "a@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
      {
        id: "BID_INT_4", address: "20 B St", city: "Palm Coast", county: "Flagler",
        zipCode: "32164", homeowner: "p2", homeownerEmail: "b@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/daytona beach/i));
    await user.click(screen.getByRole("button", { name: /^flagler$/i }));
    expect(screen.queryByText(/daytona beach/i)).not.toBeInTheDocument();
    // "Palm Coast, Flagler County · 32164"
    expect(screen.getByText(/flagler county/i)).toBeInTheDocument();
  });

  it("View Details button is present and enabled when unauthenticated", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_INT_5", address: "30 C St", city: "Daytona Beach", county: "Volusia",
        zipCode: "32118", homeowner: "p1", homeownerEmail: "c@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /view details/i }));
    expect(screen.getByRole("button", { name: /view details/i })).not.toBeDisabled();
  });

  it("shows proposal count from injected proposal data", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_INT_6", address: "40 D St", city: "Daytona Beach", county: "Volusia",
        zipCode: "32118", homeowner: "p1", homeownerEmail: "d@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    (window as any).__e2e_proposals = [
      { id: "PROP_A", requestId: "BID_INT_6", agentId: "agent1", status: { Pending: null }, createdAt: BigInt(0) },
      { id: "PROP_B", requestId: "BID_INT_6", agentId: "agent2", status: { Pending: null }, createdAt: BigInt(0) },
    ];
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/2 proposals/i)).toBeInTheDocument();
    });
  });
});
