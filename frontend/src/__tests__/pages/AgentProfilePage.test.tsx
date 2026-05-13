import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AgentProfilePage from "../../pages/AgentProfilePage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../services/agent", () => ({
  getAgentProfile: vi.fn(),
  getReviews:      vi.fn(),
}));

import * as agentService from "../../services/agent";

const mockGetAgentProfile = agentService.getAgentProfile as ReturnType<typeof vi.fn>;
const mockGetReviews      = agentService.getReviews as ReturnType<typeof vi.fn>;

const MOCK_PROFILE = {
  id: "principal-1", name: "Jane Smith", brokerage: "KW Realty",
  licenseNumber: "SL3123456", county: "Volusia", bio: "Top agent in Daytona Beach.",
  phone: "386-555-0100", email: "jane@kw.com", statesLicensed: ["FL"],
  avgDaysOnMarket: 22, listingsLast12Months: 14, isVerified: true,
  createdAt: BigInt(0), updatedAt: BigInt(0),
};

const MOCK_REVIEW_1 = {
  id: "AGREV_1", agentId: "principal-1", reviewerPrincipal: "principal-2",
  rating: BigInt(5), comment: "Outstanding service!", transactionId: "PROP_1",
  createdAt: BigInt(Date.now() * 1_000_000),
};
const MOCK_REVIEW_2 = {
  id: "AGREV_2", agentId: "principal-1", reviewerPrincipal: "principal-3",
  rating: BigInt(4), comment: "Very professional.", transactionId: "PROP_2",
  createdAt: BigInt(Date.now() * 1_000_000),
};

function renderPage(agentId = "principal-1") {
  return render(
    <MemoryRouter initialEntries={[`/agents/profile/${agentId}`]}>
      <Routes>
        <Route path="/agents/profile/:agentId" element={<AgentProfilePage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAgentProfile.mockResolvedValue(MOCK_PROFILE);
  mockGetReviews.mockResolvedValue([]);
});

describe("AgentProfilePage", () => {
  it("shows agent name after load", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Jane Smith")).toBeInTheDocument());
  });

  it("shows brokerage and license", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/KW Realty/)).toBeInTheDocument();
      expect(screen.getByText(/SL3123456/)).toBeInTheDocument();
    });
  });

  it("shows Verified badge for verified agent", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/verified/i)).toBeInTheDocument());
  });

  it("shows bio text", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/top agent in daytona beach/i)).toBeInTheDocument());
  });

  it("shows avg days on market stat", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("22")).toBeInTheDocument());
  });

  it("shows listings last 12 months stat", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("14")).toBeInTheDocument());
  });

  it("shows empty reviews state when no reviews", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument());
  });

  it("shows review count in section heading", async () => {
    mockGetReviews.mockResolvedValue([MOCK_REVIEW_1, MOCK_REVIEW_2]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/homeowner reviews \(2\)/i)).toBeInTheDocument());
  });

  it("shows review comment text", async () => {
    mockGetReviews.mockResolvedValue([MOCK_REVIEW_1]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/outstanding service/i)).toBeInTheDocument());
  });

  it("shows average rating when reviews exist", async () => {
    mockGetReviews.mockResolvedValue([MOCK_REVIEW_1, MOCK_REVIEW_2]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/4\.5/)).toBeInTheDocument());
  });

  it("shows 'not found' message when profile is null", async () => {
    mockGetAgentProfile.mockResolvedValue(null);
    renderPage();
    await waitFor(() => expect(screen.getByText(/agent profile not found/i)).toBeInTheDocument());
  });

  it("calls getAgentProfile and getReviews with the agentId from the URL", async () => {
    renderPage("abc-principal");
    await waitFor(() => expect(mockGetAgentProfile).toHaveBeenCalledWith("abc-principal"));
    expect(mockGetReviews).toHaveBeenCalledWith("abc-principal");
  });
});
