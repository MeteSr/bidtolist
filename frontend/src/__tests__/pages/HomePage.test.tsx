import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("renders hero headline", () => {
    renderPage();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s.length).toBeGreaterThanOrEqual(1);
    const combined = h1s.map(h => h.textContent ?? "").join(" ");
    expect(combined).toMatch(/agents.*compete|don't interview/i);
  });

  it("renders Post Your Home Free CTA", () => {
    renderPage();
    const links = screen.getAllByRole("link", { name: /post your home free/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("renders How It Works section with three steps", () => {
    renderPage();
    expect(screen.getByText(/post your property/i)).toBeInTheDocument();
    expect(screen.getByText(/agents compete/i)).toBeInTheDocument();
    expect(screen.getByText(/choose the best fit/i)).toBeInTheDocument();
  });

  it("renders results statistics bar", () => {
    renderPage();
    expect(screen.getByText(/\$5,000\+/)).toBeInTheDocument();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it("renders comparison section", () => {
    renderPage();
    expect(screen.getByText(/find the best agent/i)).toBeInTheDocument();
    expect(screen.getByText(/traditional way/i)).toBeInTheDocument();
    expect(screen.getByText(/bidtolist way/i)).toBeInTheDocument();
  });

  it("renders testimonials section", () => {
    renderPage();
    expect(screen.getByText(/what homeowners are saying/i)).toBeInTheDocument();
    expect(screen.getByText(/pelican bay/i)).toBeInTheDocument();
  });

  it("renders FAQ section with accordion items", () => {
    renderPage();
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
    expect(screen.getByText(/will i be flooded with calls/i)).toBeInTheDocument();
  });

  it("toggles FAQ accordion open and closed", () => {
    renderPage();
    const faqBtn = screen.getByText(/will i be flooded with calls/i).closest("button")!;
    fireEvent.click(faqBtn);
    expect(screen.getByText(/agents submit proposals through our platform/i)).toBeInTheDocument();
    fireEvent.click(faqBtn);
    expect(screen.queryByText(/agents submit proposals through our platform/i)).not.toBeInTheDocument();
  });

  it("renders For Agents nav link", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /for agents/i })).toBeInTheDocument();
  });

  it("shows Dashboard button when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true, principal: "abc", role: "agent",
      isLoading: false, login: vi.fn(), loginWithRole: vi.fn(), logout: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("shows Log In button when unauthenticated", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });
});
