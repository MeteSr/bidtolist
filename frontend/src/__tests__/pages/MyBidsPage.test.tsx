import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MyBidsPage from "../../pages/MyBidsPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../services/listing", () => ({
  getMyBidRequests: vi.fn(),
  getProposalsForRequest: vi.fn(),
  acceptProposal: vi.fn(),
}));
vi.mock("../../services/agent", () => ({
  addReview: vi.fn(),
}));
vi.mock("../../services/email", () => ({
  notifyProposalResult: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import * as listingService from "../../services/listing";
import * as agentService from "../../services/agent";
import * as emailService from "../../services/email";
import toast from "react-hot-toast";

const mockNotifyProposalResult   = emailService.notifyProposalResult as ReturnType<typeof vi.fn>;
const mockGetMyBidRequests       = listingService.getMyBidRequests as ReturnType<typeof vi.fn>;
const mockGetProposalsForRequest = listingService.getProposalsForRequest as ReturnType<typeof vi.fn>;
const mockAcceptProposal         = listingService.acceptProposal as ReturnType<typeof vi.fn>;
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
  mockAddReview.mockResolvedValue({ ok: {} });
});

describe("MyBidsPage — listings", () => {
  it("renders page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /my listing requests/i })).toBeInTheDocument();
  });

  it("shows empty state when no requests", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/no listing requests yet/i)).toBeInTheDocument());
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
    await waitFor(() => expect(screen.getByText(/closes in/i)).toBeInTheDocument());
  });
});

describe("MyBidsPage — sealed / revealed logic", () => {
  it("shows Sealed button when deadline has not passed", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_OPEN]);
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /^sealed$/i })).toBeInTheDocument());
  });

  it("shows View Proposals button when deadline has passed", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /view.*proposals/i })).toBeInTheDocument());
  });

  it("loads and shows proposals when View Proposals is clicked", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /view.*proposals/i }));
    await user.click(screen.getByRole("button", { name: /view.*proposals/i }));
    await waitFor(() => {
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(screen.getByText(/keller williams/i)).toBeInTheDocument();
    });
  });

  it("shows commission percentage in proposal", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /view.*proposals/i }));
    await user.click(screen.getByRole("button", { name: /view.*proposals/i }));
    await waitFor(() => expect(screen.getByText(/2\.50%/)).toBeInTheDocument());
  });

  it("shows empty proposals message when none received", async () => {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /view.*proposals/i }));
    await user.click(screen.getByRole("button", { name: /view.*proposals/i }));
    await waitFor(() => expect(screen.getByText(/no proposals received/i)).toBeInTheDocument());
  });
});

describe("MyBidsPage — accept proposal", () => {
  async function openProposals() {
    mockGetMyBidRequests.mockResolvedValue([MOCK_REQUEST_PAST]);
    mockGetProposalsForRequest.mockResolvedValue([MOCK_PROPOSAL]);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /view.*proposals/i }));
    await user.click(screen.getByRole("button", { name: /view.*proposals/i }));
    await waitFor(() => screen.getByRole("button", { name: /accept this agent/i }));
    return user;
  }

  it("calls acceptProposal with proposal id", async () => {
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /accept this agent/i }));
    await waitFor(() => expect(mockAcceptProposal).toHaveBeenCalledWith("PROP_1"));
  });

  it("shows success toast on accept", async () => {
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /accept this agent/i }));
    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());
  });

  it("shows error toast when acceptProposal returns err", async () => {
    mockAcceptProposal.mockResolvedValue({ err: { NotAuthorized: null } } as any);
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /accept this agent/i }));
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
  });

  it("fires notifyProposalResult with won=true for the accepted agent", async () => {
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /accept this agent/i }));
    await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());
    expect(mockNotifyProposalResult).toHaveBeenCalledWith(
      expect.objectContaining({ agentEmail: "jane@kw.com", won: true })
    );
  });

  it("does not fire notifyProposalResult when acceptProposal returns err", async () => {
    mockAcceptProposal.mockResolvedValue({ err: { NotAuthorized: null } } as any);
    const user = await openProposals();
    await user.click(screen.getByRole("button", { name: /accept this agent/i }));
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
    await waitFor(() => screen.getByRole("button", { name: /view.*proposals/i }));
    await user.click(screen.getByRole("button", { name: /view.*proposals/i }));
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
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /view.*proposals/i }));
    await user.click(screen.getByRole("button", { name: /view.*proposals/i }));
    await waitFor(() => screen.getByText(/jane smith/i));
    expect(screen.queryByTestId("review-form")).toBeNull();
  });
});
