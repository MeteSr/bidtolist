/**
 * Integration tests for MyBidsPage.
 * The real service functions run — no vi.mock on listing or agent services.
 * Data is injected via window.__e2e_requests and window.__e2e_proposals,
 * which the service layer reads at call time.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MyBidsPage from "../../pages/MyBidsPage";

// ── Only mock auth, navigation, and toast ─────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const FUTURE_NS  = BigInt(Date.now() + 7 * 24 * 60 * 60 * 1000) * BigInt(1_000_000);
const PAST_NS    = BigInt(Date.now() - 2 * 24 * 60 * 60 * 1000) * BigInt(1_000_000);

function renderPage() {
  return render(
    <MemoryRouter>
      <MyBidsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  delete (window as any).__e2e_requests;
  delete (window as any).__e2e_proposals;
  mockUseAuth.mockReturnValue({
    isAuthenticated: true, principal: "homeowner-p", role: "homeowner",
    isLoading: false, login: vi.fn(), logout: vi.fn(),
  });
});

afterEach(() => {
  delete (window as any).__e2e_requests;
  delete (window as any).__e2e_proposals;
});

describe("MyBidsPage — integration (real service, mock fallback)", () => {
  it("shows empty state when no requests are injected", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no listing requests yet/i)).toBeInTheDocument();
    });
  });

  it("shows address and county for an injected open request", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_MY_1", address: "123 Oak St", city: "Daytona Beach", county: "Volusia",
        zipCode: "32118", homeowner: "homeowner-p", homeownerEmail: "owner@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/123 oak st/i)).toBeInTheDocument();
      expect(screen.getByText(/volusia/i)).toBeInTheDocument();
    });
  });

  it("shows Sealed button for open request (bid window still open)", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_MY_2", address: "456 Elm St", city: "Palm Coast", county: "Flagler",
        zipCode: "32164", homeowner: "homeowner-p", homeownerEmail: "owner@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^sealed$/i })).toBeInTheDocument();
    });
  });

  it("shows View Proposals button when deadline has passed", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_MY_3", address: "789 Pine Ave", city: "Daytona Beach", county: "Volusia",
        zipCode: "32118", homeowner: "homeowner-p", homeownerEmail: "owner@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: PAST_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /view.*proposals/i })).toBeInTheDocument();
    });
  });

  it("reveals proposals and shows agent name on View Proposals click", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_MY_4", address: "1 Bid Rd", city: "Daytona Beach", county: "Volusia",
        zipCode: "32118", homeowner: "homeowner-p", homeownerEmail: "owner@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: PAST_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    (window as any).__e2e_proposals = [
      {
        id: "PROP_INT_1", requestId: "BID_MY_4", agentId: "agent-p",
        agentName: "Jane Smith", agentEmail: "jane@kw.com", agentBrokerage: "Keller Williams",
        commissionBps: 275, cmaSummary: "Good comps", marketingPlan: "MLS + Zillow",
        estimatedDaysOnMarket: 25, estimatedSalePrice: 350000,
        includedServices: ["MLS Listing"], validUntil: BigInt(0),
        coverLetter: "I know this area.", status: { Pending: null }, createdAt: BigInt(0),
      },
    ];
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /view.*proposals/i }));
    await user.click(screen.getByRole("button", { name: /view.*proposals/i }));
    await waitFor(() => {
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(screen.getByText(/keller williams/i)).toBeInTheDocument();
      expect(screen.getByText(/2\.75%/)).toBeInTheDocument();
    });
  });

  it("shows empty proposals message when deadline passed but no proposals received", async () => {
    (window as any).__e2e_requests = [
      {
        id: "BID_MY_5", address: "2 Empty Ln", city: "Palm Coast", county: "Flagler",
        zipCode: "32164", homeowner: "homeowner-p", homeownerEmail: "owner@test.com",
        targetListDate: BigInt(0), desiredSalePrice: [], notes: "",
        bidDeadline: PAST_NS, status: { Open: null }, createdAt: BigInt(0), feePaid: false,
      },
    ];
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /view.*proposals/i }));
    await user.click(screen.getByRole("button", { name: /view.*proposals/i }));
    await waitFor(() => {
      expect(screen.getByText(/no proposals received/i)).toBeInTheDocument();
    });
  });
});
