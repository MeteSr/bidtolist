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
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/let agents.*compete.*your listing/i);
  });

  it("renders Post Your Home CTA", () => {
    renderPage();
    expect(screen.getAllByRole("link", { name: /post your home/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders hero CTAs for homeowners and agents", () => {
    renderPage();
    expect(screen.getAllByRole("link", { name: /post your home/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /join as an agent/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders how it works section with 3 steps", () => {
    renderPage();
    expect(screen.getAllByText(/post your home/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/agents bid blind/i)).toBeInTheDocument();
    expect(screen.getByText(/you pick the winner/i)).toBeInTheDocument();
  });

  it("renders pricing clarity — no subscription", () => {
    renderPage();
    expect(screen.getAllByText(/\$295/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/no subscription/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows brokerage band for agents", () => {
    renderPage();
    expect(screen.getByText(/serving agents from/i)).toBeInTheDocument();
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
