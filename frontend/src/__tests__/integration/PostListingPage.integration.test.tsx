/**
 * Integration tests for PostListingPage.
 * The real service functions run — no vi.mock on the service layer.
 * Auth state is controlled via mockUseAuth; homeowner verified state via
 * window.__e2e_homeowner_verified (read at call time by isHomeownerVerified).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PostListingPage from "../../pages/PostListingPage";

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

function renderPage() {
  return render(
    <MemoryRouter>
      <PostListingPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  delete (window as any).__e2e_homeowner_verified;
  delete (window as any).__e2e_requests;
  mockUseAuth.mockReturnValue({
    isAuthenticated: false, principal: null, role: null,
    isLoading: false, login: vi.fn(), logout: vi.fn(),
  });
});

afterEach(() => {
  delete (window as any).__e2e_homeowner_verified;
  delete (window as any).__e2e_requests;
});

describe("PostListingPage — integration (real service, mock fallback)", () => {
  it("shows sign-in gate when not authenticated", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("sign-in-gate")).toBeInTheDocument();
    });
  });

  it("shows verify ownership prompt when authenticated but not verified", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true, principal: "homeowner-p", role: "homeowner",
      isLoading: false, login: vi.fn(), logout: vi.fn(),
    });
    // __e2e_homeowner_verified not set → isHomeownerVerified() returns false
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/verify your ownership/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /start verification/i })).toBeInTheDocument();
  });

  it("shows listing form when authenticated and verified", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true, principal: "homeowner-p", role: "homeowner",
      isLoading: false, login: vi.fn(), logout: vi.fn(),
    });
    (window as any).__e2e_homeowner_verified = true;
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
  });

  it("submitting the form creates a bid request and navigates to /my-bids", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true, principal: "homeowner-p", role: "homeowner",
      isLoading: false, login: vi.fn(), logout: vi.fn(),
    });
    (window as any).__e2e_homeowner_verified = true;
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByLabelText(/street address/i));

    await user.type(screen.getByLabelText(/street address/i), "789 Pine Rd");
    await user.type(screen.getByLabelText(/city/i), "Daytona Beach");
    await user.type(screen.getByLabelText(/zip code/i), "32118");
    await user.type(screen.getByLabelText(/target list date/i), "2026-09-01");
    await user.type(screen.getByLabelText(/contact email/i), "owner@test.com");
    await user.click(screen.getByRole("button", { name: /post listing/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/my-bids");
    });

    // Bid request was pushed into the mock store
    const stored = (window as any).__e2e_requests;
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBe(1);
    expect(stored[0].city).toBe("Daytona Beach");
  });
});
