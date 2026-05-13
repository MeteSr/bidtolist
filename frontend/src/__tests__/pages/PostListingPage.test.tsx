import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PostListingPage from "../../pages/PostListingPage";

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
  isHomeownerVerified: vi.fn(),
  createBidRequest: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import * as listingService from "../../services/listing";
import toast from "react-hot-toast";

const mockIsHomeownerVerified = listingService.isHomeownerVerified as ReturnType<typeof vi.fn>;
const mockCreateBidRequest = listingService.createBidRequest as ReturnType<typeof vi.fn>;

function renderPage() {
  return render(
    <MemoryRouter>
      <PostListingPage />
    </MemoryRouter>
  );
}

const authedHomeowner = {
  isAuthenticated: true, principal: "abc", role: "homeowner" as const,
  isLoading: false, login: vi.fn(), logout: vi.fn(),
};

const unauthUser = {
  isAuthenticated: false, principal: null, role: null as null,
  isLoading: false, login: vi.fn(), logout: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
});

describe("PostListingPage — verification gate", () => {
  it("shows loading state while checking verification", () => {
    mockUseAuth.mockReturnValue(authedHomeowner);
    mockIsHomeownerVerified.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(screen.getByText(/checking/i)).toBeInTheDocument();
  });

  it("shows verification CTA when homeowner is not verified", async () => {
    mockUseAuth.mockReturnValue(authedHomeowner);
    mockIsHomeownerVerified.mockResolvedValue(false);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/verify your ownership/i)).toBeInTheDocument();
    });
  });

  it("does not show the listing form when not verified", async () => {
    mockUseAuth.mockReturnValue(authedHomeowner);
    mockIsHomeownerVerified.mockResolvedValue(false);
    renderPage();
    await waitFor(() => {
      expect(screen.queryByLabelText(/street address/i)).not.toBeInTheDocument();
    });
  });

  it("shows listing form when homeowner is verified", async () => {
    mockUseAuth.mockReturnValue(authedHomeowner);
    mockIsHomeownerVerified.mockResolvedValue(true);
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    });
  });

  it("shows login CTA when not authenticated", async () => {
    mockUseAuth.mockReturnValue(unauthUser);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("sign-in-gate")).toBeInTheDocument();
    });
  });

  it("does not call isHomeownerVerified when not authenticated", async () => {
    mockUseAuth.mockReturnValue(unauthUser);
    renderPage();
    await new Promise<void>((r) => setTimeout(r, 50));
    expect(mockIsHomeownerVerified).not.toHaveBeenCalled();
  });
});

describe("PostListingPage — form submission", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(authedHomeowner);
    mockIsHomeownerVerified.mockResolvedValue(true);
    mockCreateBidRequest.mockResolvedValue({ ok: { id: "BID_1" } } as any);
  });

  it("renders all required form fields", async () => {
    renderPage();
    await waitFor(() => screen.getByLabelText(/street address/i));
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/county/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target list date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bid deadline/i)).toBeInTheDocument();
  });

  it("has Volusia and Flagler county options", async () => {
    renderPage();
    await waitFor(() => screen.getByLabelText(/county/i));
    const select = screen.getByLabelText(/county/i) as HTMLSelectElement;
    const options = Array.from(select.options).map(o => o.value);
    expect(options).toContain("Volusia");
    expect(options).toContain("Flagler");
  });

  it("has bid deadline options with minimum 48 hours", async () => {
    renderPage();
    await waitFor(() => screen.getByLabelText(/bid deadline/i));
    const select = screen.getByLabelText(/bid deadline/i) as HTMLSelectElement;
    const values = Array.from(select.options).map(o => o.value);
    const hours = values.map(Number);
    expect(Math.min(...hours)).toBeGreaterThanOrEqual(48);
    expect(values).toEqual(expect.arrayContaining(["48", "72", "168"]));
  });

  it("calls createBidRequest and navigates on success", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByLabelText(/street address/i));

    await user.type(screen.getByLabelText(/street address/i), "123 Oak St");
    await user.type(screen.getByLabelText(/city/i), "Daytona Beach");
    await user.type(screen.getByLabelText(/zip code/i), "32118");
    await user.type(screen.getByLabelText(/target list date/i), "2026-08-01");
    await user.click(screen.getByRole("button", { name: /post listing/i }));

    await waitFor(() => {
      expect(mockCreateBidRequest).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/my-bids");
    });
  });

  it("shows error toast when canister returns err", async () => {
    mockCreateBidRequest.mockResolvedValue({ err: { NotAuthorized: null } } as any);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByLabelText(/street address/i));

    await user.type(screen.getByLabelText(/street address/i), "123 Oak St");
    await user.type(screen.getByLabelText(/city/i), "Daytona Beach");
    await user.click(screen.getByRole("button", { name: /post listing/i }));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
