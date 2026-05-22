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
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s.length).toBeGreaterThanOrEqual(1);
    const combined = h1s.map(h => h.textContent ?? "").join(" ");
    expect(combined).toMatch(/listings.*competition/i);
  });

  it("renders hero Get Started CTA", () => {
    renderPage();
    expect(screen.getAllByRole("link", { name: /get started/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders hero CTAs for homeowners and agents", () => {
    renderPage();
    expect(screen.getAllByRole("link", { name: /get started/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /learn more/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders how it works section with steps", () => {
    renderPage();
    expect(screen.getByText(/new listing added/i)).toBeInTheDocument();
    expect(screen.getByText(/agents bid/i)).toBeInTheDocument();
    expect(screen.getByText(/best bid wins/i)).toBeInTheDocument();
  });

  it("renders trust band for realtors", () => {
    renderPage();
    expect(screen.getByText(/built for realtors/i)).toBeInTheDocument();
  });

  it("shows brokerage names for agents", () => {
    renderPage();
    expect(screen.getByText(/trusted by agents/i)).toBeInTheDocument();
    expect(screen.getByText(/keller williams/i)).toBeInTheDocument();
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
