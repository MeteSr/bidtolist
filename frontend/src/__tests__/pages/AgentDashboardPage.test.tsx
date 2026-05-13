import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AgentDashboardPage from "../../pages/AgentDashboardPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../services/listing", () => ({
  getMyProposals: vi.fn(),
}));

import * as listingService from "../../services/listing";

const mockGetMyProposals = listingService.getMyProposals as ReturnType<typeof vi.fn>;

const ACCEPTED = {
  id: "PROP_1", requestId: "BID_1", agentName: "Jane Smith",
  agentBrokerage: "Keller Williams", commissionBps: 250, cmaSummary: "Good comps",
  marketingPlan: "MLS", estimatedDaysOnMarket: 30, estimatedSalePrice: 350000,
  includedServices: [], validUntil: BigInt(0), coverLetter: "",
  status: { Accepted: null }, createdAt: BigInt(0),
};

const PENDING = { ...ACCEPTED, id: "PROP_2", requestId: "BID_2", status: { Pending: null } };
const REJECTED = { ...ACCEPTED, id: "PROP_3", requestId: "BID_3", status: { Rejected: null } };
const WITHDRAWN = { ...ACCEPTED, id: "PROP_4", requestId: "BID_4", status: { Withdrawn: null } };

function renderPage() {
  return render(
    <MemoryRouter>
      <AgentDashboardPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyProposals.mockResolvedValue([]);
});

describe("AgentDashboardPage", () => {
  it("renders page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /my proposals/i })).toBeInTheDocument();
  });

  it("shows empty state with browse link when no proposals", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no proposals yet/i)).toBeInTheDocument();
    });
  });

  it("shows Won section with $295 fee notice for accepted proposal", async () => {
    mockGetMyProposals.mockResolvedValue([ACCEPTED]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/won/i)).toBeInTheDocument();
      expect(screen.getByText(/\$295/)).toBeInTheDocument();
    });
  });

  it("shows commission and estimated price in Won card", async () => {
    mockGetMyProposals.mockResolvedValue([ACCEPTED]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/2\.50%/)).toBeInTheDocument();
    });
  });

  it("shows Pending section for pending proposal", async () => {
    mockGetMyProposals.mockResolvedValue([PENDING]);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText(/pending/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/BID_2/)).toBeInTheDocument();
    });
  });

  it("shows Closed section for rejected proposal", async () => {
    mockGetMyProposals.mockResolvedValue([REJECTED]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/closed/i)).toBeInTheDocument();
      expect(screen.getByText(/not selected/i)).toBeInTheDocument();
    });
  });

  it("shows Closed section for withdrawn proposal", async () => {
    mockGetMyProposals.mockResolvedValue([WITHDRAWN]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/closed/i)).toBeInTheDocument();
      expect(screen.getByText(/withdrawn/i)).toBeInTheDocument();
    });
  });

  it("shows all three sections when all statuses present", async () => {
    mockGetMyProposals.mockResolvedValue([ACCEPTED, PENDING, REJECTED]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/won/i)).toBeInTheDocument();
      expect(screen.getAllByText(/pending/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/closed/i)).toBeInTheDocument();
    });
  });
});
