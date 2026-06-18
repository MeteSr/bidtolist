import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MyBidsPage from "../../pages/MyBidsPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: false, principal: null, role: null, logout: vi.fn(), login: vi.fn() }),
}));

vi.mock("../../services/listing", () => ({
  getMyBidRequests: vi.fn(),
  getProposalsForRequest: vi.fn(),
  acceptProposal: vi.fn(),
  cancelBidRequest: vi.fn(),
  markRevealNotified: vi.fn(),
}));
vi.mock("../../services/agent", () => ({
  addReview: vi.fn(),
}));
vi.mock("../../services/email", () => ({
  notifyProposalResult: vi.fn(),
  notifyRevealOpened: vi.fn(),
  notifyListingCancelled: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import * as listingService from "../../services/listing";
import * as agentService from "../../services/agent";
import * as emailService from "../../services/email";
import toast from "react-hot-toast";

const mockNotifyProposalResult   = emailService.notifyProposalResult   as ReturnType<typeof vi.fn>;
const mockNotifyRevealOpened     = emailService.notifyRevealOpened     as ReturnType<typeof vi.fn>;
const mockNotifyListingCancelled = emailService.notifyListingCancelled as ReturnType<typeof vi.fn>;
const mockGetMyBidRequests       = listingService.getMyBidRequests       as ReturnType<typeof vi.fn>;
const mockGetProposalsForRequest = listingService.getProposalsForRequest as ReturnType<typeof vi.fn>;
const mockAcceptProposal         = listingService.acceptProposal         as ReturnType<typeof vi.fn>;
const mockCancelBidRequest       = listingService.cancelBidRequest       as ReturnType<typeof vi.fn>;
const mockMarkRevealNotified     = listingService.markRevealNotified     as ReturnType<typeof vi.fn>;
const mockAddReview              = agentService.addReview as ReturnType<typeof vi.fn>;

const PAST_NS   = BigInt(Date.now() - 2 * 24 * 60 * 60 * 1000) * BigInt(1_000_000);
const FUTURE_NS = BigInt(Date.now() + 7 * 24 * 60 * 60 * 1000) * BigInt(1_000_000);

const MOCK_REQUEST_OPEN = {
  id: "BID_1", address: "123 Oak St", city: "Daytona Beach", county: "Volusia",
  zipCode: "32118", targetListDate: BigInt(0), desiredSalePrice: [],
  notes: "", bidDeadline: FUTURE_NS, status: { Open: null }, createdAt: BigInt(0),
};
const MOCK_REQUEST_PAST = { ...MOCK_REQUEST_OPEN, id: "BID_2", bidDeadline: PAST_NS };

const MOCK_PROPOSAL = {
  id: "PROP_1", requestId: "BID_2", agentId: "principal-agent-1",
  agentName: "Jane Smith", agentEmail: "jane@kw.com",
  agentBrokerage: "Keller Williams", commissionBps: 250, cmaSummary: "Great comps",
  marketingPlan: "MLS + Zillow", estimatedDaysOnMarket: 30, estimatedSalePrice: 350000,
  includedServices: ["MLS Listing"], validUntil: BigInt(0), coverLetter: "I'm the best",
  status: { Pending: null }, createdAt: BigInt(0),
};
const MOCK_ACCEPTED = { ...MOCK_PROPOSAL, id: "PROP_2", status: { Accepted: null } };

function renderPage() {
  return render(<MemoryRouter><MyBidsPage /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyBidRequests.mockResolvedValue([]);
  mockGetProposalsForRequest.mockResolvedValue([]);
  mockAcceptProposal.mockResolvedValue({ ok: null } as any);
  mockCancelBidRequest.mockResolvedValue({ ok: null } as any);
  mockMarkRevealNotified.mockResolvedValue(true);
  mockAddReview.mockResolvedValue({ ok: {} });
});

describe("MyBidsPage — listings", () => {
  it("renders page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("shows empty state when no requests", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/no active listings yet/i)).toBeInTheDocument());
  });

  it("shows request address and county", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/123 Oak St/i)).toBeInTheDocument();
      expect(screen.getByText(/Volusia/)).toBeInTheDocument();
    });
  });

  it("shows bid window countdown for open requests", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    renderPage();
    // Use anchored regex — "Bidding Closes In" (right rail label) also contains "closes in"
    await waitFor(() => expect(screen.getByText(/^Closes in/i)).toBeInTheDocument());
  });
});

describe("MyBidsPage — sealed / revealed logic", () => {
  it("shows bids-sealed message when deadline has not passed", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/bids are sealed until the deadline/i)).toBeInTheDocument()
    );
  });

  it("shows no-proposals message when deadline has passed and no proposals received", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no proposals received/i)).toBeInTheDocument()
    );
  });

  it("loads and shows proposals after deadline", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText(/jane smith/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/keller williams/i).length).toBeGreaterThan(0);
    });
  });

  it("shows commission percentage in proposal", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    renderPage();
    await waitFor(() => expect(screen.getAllByText(/2\.50%/).length).toBeGreaterThan(0));
  });

  it("shows empty proposals message when none received", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/no proposals received/i)).toBeInTheDocument());
  });
});

describe("MyBidsPage — accept proposal", () => {
  async function openProposals() {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /select agent/i }));
    return user;
  }

  it("calls acceptProposal with proposal id", async () => {
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /select agent/i }));
    await waitFor(() => expect(mockAcceptProposal).toHaveBeenCalledWith("PROP_1"));
  });

  it("shows success toast on accept", async () => {
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /select agent/i }));
    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());
  });

  it("shows error toast when acceptProposal returns err", async () => {
    mockAcceptProposal.mockResolvedValue({ err: { NotAuthorized: null } } as any);
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /select agent/i }));
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
  });

  it("fires notifyProposalResult with won=true for the accepted agent", async () => {
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /select agent/i }));
    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());
    expect(mockNotifyProposalResult).toHaveBeenCalledWith(
      expect.objectContaining({ agentEmail: "jane@kw.com", won: true })
    );
  });

  it("does not fire notifyProposalResult when acceptProposal returns err", async () => {
    mockAcceptProposal.mockResolvedValue({ err: { NotAuthorized: null } } as any);
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /select agent/i }));
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(mockNotifyProposalResult).not.toHaveBeenCalled();
  });
});

describe("MyBidsPage — review form", () => {
  async function openAccepted() {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_ACCEPTED]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByTestId("review-form"));
    return user;
  }

  it("shows review form for accepted proposal", async () => {
    await openAccepted();
    expect(screen.getByTestId("review-form")).toBeInTheDocument();
  });

  it("shows agent name in review prompt", async () => {
    await openAccepted();
    expect(screen.getByText(/rate jane smith/i)).toBeInTheDocument();
  });

  it("renders 5 star buttons", async () => {
    await openAccepted();
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`star-${i}`)).toBeInTheDocument();
    }
  });

  it("shows error toast when submitting with no star selected", async () => {
    const user = await openAccepted();
    await user.click(screen.getByTestId("review-submit"));
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/star rating/i)));
  });

  it("calls addReview with correct args after selecting stars and submitting", async () => {
    const user = await openAccepted();
    await user.click(screen.getByTestId("star-4"));
    await user.type(screen.getByTestId("review-comment"), "Great agent!");
    await user.click(screen.getByTestId("review-submit"));
    await waitFor(() => expect(mockAddReview).toHaveBeenCalledWith({
      agentId: "principal-agent-1",
      rating: 4,
      comment: "Great agent!",
      transactionId: "PROP_2",
    }));
  });

  it("shows confirmation message after successful review", async () => {
    const user = await openAccepted();
    await user.click(screen.getByTestId("star-5"));
    await user.click(screen.getByTestId("review-submit"));
    await waitFor(() => expect(screen.getByTestId("review-done")).toBeInTheDocument());
  });

  it("shows error toast on DuplicateReview", async () => {
    mockAddReview.mockResolvedValue({ err: { DuplicateReview: null } });
    const user = await openAccepted();
    await user.click(screen.getByTestId("star-3"));
    await user.click(screen.getByTestId("review-submit"));
    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/already reviewed/i))
    );
  });

  it("shows View Profile link for accepted proposal", async () => {
    await openAccepted();
    expect(screen.getByRole("link", { name: /view profile/i })).toBeInTheDocument();
  });

  it("does not show review form for pending proposal", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    renderPage();
    await waitFor(() => expect(screen.getAllByText(/jane smith/i).length).toBeGreaterThan(0));
    expect(screen.queryByTestId("review-form")).toBeNull();
  });
});

describe("MyBidsPage — cancel listing", () => {
  it("shows Cancel listing button when bid window is open", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /cancel listing/i })).toBeInTheDocument()
    );
  });

  it("still shows Cancel listing button after deadline when status is still Open", async () => {
    // biddingOpen is determined by status.Open, not by deadline —
    // homeowners can cancel an Open listing even after the bid window closes.
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/no proposals received/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /cancel listing/i })).toBeInTheDocument();
  });

  it("does not show Cancel listing button when status is Expired", async () => {
    const expiredReq = { ...MOCK_REQUEST_PAST, id: "BID_EXP", status: { Expired: null } };
    mockGetMyBidRequests.mockResolvedValue([expiredReq]);
    mockGetProposalsForRequest.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/no proposals received/i)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /cancel listing/i })).toBeNull();
  });

  it("calls cancelBidRequest with the request id when user confirms", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /cancel listing/i }));
    await user.click(screen.getByRole("button", { name: /cancel listing/i }));
    await waitFor(() => expect(mockCancelBidRequest).toHaveBeenCalledWith("BID_1"));
  });

  it("does not call cancelBidRequest when user dismisses confirm", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /cancel listing/i }));
    await user.click(screen.getByRole("button", { name: /cancel listing/i }));
    expect(mockCancelBidRequest).not.toHaveBeenCalled();
  });

  it("shows success toast on cancel", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /cancel listing/i }));
    await user.click(screen.getByRole("button", { name: /cancel listing/i }));
    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/cancelled/i)));
  });

  it("fires notifyListingCancelled for each agent who has a proposal", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    mockGetProposalsForRequest.mockResolvedValue([
      { ...MOCK_PROPOSAL, id: "PROP_A", requestId: "BID_1", agentEmail: "agent_a@kw.com", agentName: "Agent A" },
      { ...MOCK_PROPOSAL, id: "PROP_B", requestId: "BID_1", agentEmail: "agent_b@re.com", agentName: "Agent B" },
    ]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /cancel listing/i }));
    await user.click(screen.getByRole("button", { name: /cancel listing/i }));
    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());
    expect(mockNotifyListingCancelled).toHaveBeenCalledWith(
      expect.objectContaining({ agentEmail: "agent_a@kw.com", agentName: "Agent A" })
    );
    expect(mockNotifyListingCancelled).toHaveBeenCalledWith(
      expect.objectContaining({ agentEmail: "agent_b@re.com", agentName: "Agent B" })
    );
  });

  it("shows error toast when cancelBidRequest returns err", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockCancelBidRequest.mockResolvedValue({ err: { NotAuthorized: null } } as any);
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /cancel listing/i }));
    await user.click(screen.getByRole("button", { name: /cancel listing/i }));
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(mockNotifyListingCancelled).not.toHaveBeenCalled();
  });
});

describe("MyBidsPage — reveal notification", () => {
  it("calls markRevealNotified when deadline has passed", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    renderPage();
    await waitFor(() => expect(mockMarkRevealNotified).toHaveBeenCalledWith("BID_2"));
  });

  it("fires notifyRevealOpened when markRevealNotified returns true (first reveal)", async () => {
    mockMarkRevealNotified.mockResolvedValue(true);
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    renderPage();
    await waitFor(() => expect(mockNotifyRevealOpened).toHaveBeenCalledWith("BID_2"));
  });

  it("does NOT fire notifyRevealOpened when markRevealNotified returns false (already notified)", async () => {
    mockMarkRevealNotified.mockResolvedValue(false);
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    renderPage();
    await waitFor(() => expect(mockMarkRevealNotified).toHaveBeenCalled());
    expect(mockNotifyRevealOpened).not.toHaveBeenCalled();
  });

  it("does NOT call markRevealNotified when deadline has not passed", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    mockGetProposalsForRequest.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/bids are sealed until the deadline/i)).toBeInTheDocument());
    expect(mockMarkRevealNotified).not.toHaveBeenCalled();
  });
});

describe("MyBidsPage — multiple agents", () => {
  const FIVE_PROPOSALS = Array.from({ length: 5 }, (_, i) => ({
    id: `PROP_${i + 1}`,
    requestId: "BID_2",
    agentId: `agent-${i}`,
    agentName: `Agent ${i + 1}`,
    agentEmail: `agent${i + 1}@kw.com`,
    agentBrokerage: "Keller Williams",
    commissionBps: 200 + i * 25,
    cmaSummary: `CMA for agent ${i + 1}`,
    marketingPlan: "MLS",
    estimatedDaysOnMarket: 30,
    estimatedSalePrice: 350_000,
    includedServices: ["MLS"],
    validUntil: BigInt(0),
    coverLetter: `Cover letter ${i + 1}`,
    status: { Pending: null },
    createdAt: BigInt(0),
  }));

  it("shows all 5 agent names after deadline", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue(FIVE_PROPOSALS);
    renderPage();
    for (let i = 1; i <= 5; i++) {
      await waitFor(() =>
        expect(screen.getAllByText(new RegExp(`Agent ${i}`, "i")).length).toBeGreaterThan(0)
      );
    }
  });

  it("shows 5 Select Agent buttons (one per pending proposal)", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue(FIVE_PROPOSALS);
    renderPage();
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /select agent/i }).length).toBe(5)
    );
  });

  it("lowest commission offer appears first in bid overview", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue(FIVE_PROPOSALS);
    renderPage();
    await waitFor(() => screen.getAllByText(/2\.00%/i));
    const commissionCells = screen.getAllByText(/\d+\.\d+%/);
    expect(commissionCells[0].textContent).toContain("2.00");
  });
});
