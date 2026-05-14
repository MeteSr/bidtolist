import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../../pages/HomePage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    isAuthenticated: false, principal: null, role: null,
    isLoading: false, login: vi.fn(), loginWithRole: vi.fn(), logout: vi.fn(),
  });
});

describe("HomePage", () => {
  it("renders brand name", () => {
    renderPage();
    expect(screen.getAllByText(/bidtolist/i).length).toBeGreaterThan(0);
  });

  it("renders headline value prop", () => {
    renderPage();
    expect(screen.getByText(/let agents compete/i)).toBeInTheDocument();
  });

  it("renders Post Your Home CTA", () => {
    renderPage();
    // Now an anchor in the homeowner section
    expect(screen.getByRole("link", { name: /post your home/i })).toBeInTheDocument();
  });

  it("renders hero CTAs for homeowners and agents", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /i'm a homeowner/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /i'm a real estate agent/i })).toBeInTheDocument();
  });

  it("renders how it works section with 3 steps", () => {
    renderPage();
    // Step headings are inside <p> with serif; CTA button also matches "post your home"
    expect(screen.getAllByText(/post your home/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/agents bid blind/i)).toBeInTheDocument();
    expect(screen.getByText(/you pick the winner/i)).toBeInTheDocument();
  });

  it("renders pricing clarity — no subscription", () => {
    renderPage();
    // $295 appears in trust signals and pricing section; check at least one
    expect(screen.getAllByText(/\$295/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/no subscription/i)).toBeInTheDocument();
  });

  it("shows county badge for Volusia + Flagler", () => {
    renderPage();
    // Badge in hero and footer match the pattern; check at least one
    expect(screen.getAllByText(/volusia.*flagler/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows Dashboard button when authenticated agent", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true, principal: "abc", role: "agent",
      isLoading: false, login: vi.fn(), loginWithRole: vi.fn(), logout: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
  });
});
