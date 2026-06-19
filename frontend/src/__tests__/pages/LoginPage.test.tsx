import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../../pages/LoginPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function authGuest() {
  mockUseAuth.mockReturnValue({
    isAuthenticated: false, principal: null, role: null,
    isLoading: false,
    login: vi.fn(), loginWithRole: vi.fn(), logout: vi.fn(),
  });
}

function authAs(role: "homeowner" | "agent") {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true, principal: "abc", role,
    isLoading: false,
    login: vi.fn(), loginWithRole: vi.fn(), logout: vi.fn(),
  });
}

function authLoading() {
  mockUseAuth.mockReturnValue({
    isAuthenticated: false, principal: null, role: null,
    isLoading: true,
    login: vi.fn(), loginWithRole: vi.fn(), logout: vi.fn(),
  });
}

function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/login${search}`]}>
      <LoginPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authGuest();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("LoginPage", () => {
  // Layout
  it("renders the welcome heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /welcome to bidtolist/i })).toBeInTheDocument();
  });

  it("renders Log In and Sign Up tabs", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /^log in$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign up$/i })).toBeInTheDocument();
  });

  it("renders trust strip labels", () => {
    renderPage();
    expect(screen.getByText(/icp secured/i)).toBeInTheDocument();
    expect(screen.getByText(/encrypted/i)).toBeInTheDocument();
    expect(screen.getByText(/verified marketplace/i)).toBeInTheDocument();
  });

  it("renders support link", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /contact support/i })).toBeInTheDocument();
  });

  // Log In tab (default)
  it("defaults to Log In tab and shows Internet Identity button", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /continue with internet identity/i })).toBeInTheDocument();
  });

  it("shows all three social provider buttons on Log In tab", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with apple/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with microsoft/i })).toBeInTheDocument();
  });

  // Sign Up tab — role selection
  it("shows role selection when Sign Up tab is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(screen.getByText(/i am joining as/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /homeowner/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /real estate agent/i })).toBeInTheDocument();
  });

  it("advances to auth buttons after selecting Homeowner role", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    fireEvent.click(screen.getByRole("button", { name: /homeowner/i }));
    expect(screen.getByText(/joining as:.*homeowner/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account with internet identity/i })).toBeInTheDocument();
  });

  it("advances to auth buttons after selecting Agent role", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    fireEvent.click(screen.getByRole("button", { name: /real estate agent/i }));
    expect(screen.getByText(/joining as:.*real estate agent/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up with google/i })).toBeInTheDocument();
  });

  it("returns to role selection when Change role is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    fireEvent.click(screen.getByRole("button", { name: /homeowner/i }));
    fireEvent.click(screen.getByRole("button", { name: /change role/i }));
    expect(screen.getByText(/i am joining as/i)).toBeInTheDocument();
    expect(screen.queryByText(/joining as:/i)).not.toBeInTheDocument();
  });

  it("resets Sign Up state when switching back to Log In tab", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    fireEvent.click(screen.getByRole("button", { name: /homeowner/i }));
    fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));
    // Should be back to Log In tab with II button
    expect(screen.getByRole("button", { name: /continue with internet identity/i })).toBeInTheDocument();
    // Role selection should be gone
    expect(screen.queryByText(/i am joining as/i)).not.toBeInTheDocument();
  });

  // ?tab=signup query param
  it("opens Sign Up tab when ?tab=signup is in URL", () => {
    renderPage("?tab=signup");
    expect(screen.getByText(/i am joining as/i)).toBeInTheDocument();
  });

  // Auth callbacks
  it("calls login() with no provider when Internet Identity is clicked", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, principal: null, role: null,
      isLoading: false, login, loginWithRole: vi.fn(), logout: vi.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /continue with internet identity/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith(undefined));
  });

  it("calls login() with 'google' when Google is clicked", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, principal: null, role: null,
      isLoading: false, login, loginWithRole: vi.fn(), logout: vi.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith("google"));
  });

  it("calls loginWithRole() with correct role when signing up as homeowner via Apple", async () => {
    const loginWithRole = vi.fn().mockResolvedValue("homeowner");
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, principal: null, role: null,
      isLoading: false, login: vi.fn(), loginWithRole, logout: vi.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    fireEvent.click(screen.getByRole("button", { name: /homeowner/i }));
    fireEvent.click(screen.getByRole("button", { name: /sign up with apple/i }));
    await waitFor(() => expect(loginWithRole).toHaveBeenCalledWith("homeowner", "apple"));
  });

  it("navigates to /my-bids after homeowner sign-up", async () => {
    const loginWithRole = vi.fn().mockResolvedValue("homeowner");
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, principal: null, role: null,
      isLoading: false, login: vi.fn(), loginWithRole, logout: vi.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    fireEvent.click(screen.getByRole("button", { name: /homeowner/i }));
    fireEvent.click(screen.getByRole("button", { name: /create account with internet identity/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/my-bids", { replace: true }));
  });

  it("navigates to /agents/dashboard after agent sign-up", async () => {
    const loginWithRole = vi.fn().mockResolvedValue("agent");
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, principal: null, role: null,
      isLoading: false, login: vi.fn(), loginWithRole, logout: vi.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    fireEvent.click(screen.getByRole("button", { name: /real estate agent/i }));
    fireEvent.click(screen.getByRole("button", { name: /create account with internet identity/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/agents/dashboard", { replace: true }));
  });

  // Error handling
  it("shows error message when login fails", async () => {
    const login = vi.fn().mockRejectedValue(new Error("cancelled"));
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, principal: null, role: null,
      isLoading: false, login, loginWithRole: vi.fn(), logout: vi.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /continue with internet identity/i }));
    await waitFor(() =>
      expect(screen.getByText(/sign-in was cancelled or failed/i)).toBeInTheDocument()
    );
  });

  it("clears error when switching tabs", async () => {
    const login = vi.fn().mockRejectedValue(new Error("cancelled"));
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, principal: null, role: null,
      isLoading: false, login, loginWithRole: vi.fn(), logout: vi.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /continue with internet identity/i }));
    await waitFor(() =>
      expect(screen.getByText(/sign-in was cancelled or failed/i)).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(screen.queryByText(/sign-in was cancelled or failed/i)).not.toBeInTheDocument();
  });

  // Auth-state redirect
  it("renders blank while auth is loading", () => {
    authLoading();
    renderPage();
    expect(screen.queryByRole("heading", { name: /welcome to bidtolist/i })).not.toBeInTheDocument();
  });

  it("navigates away when already authenticated as homeowner", () => {
    authAs("homeowner");
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith("/my-bids", { replace: true });
  });

  it("navigates away when already authenticated as agent", () => {
    authAs("agent");
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith("/agents/dashboard", { replace: true });
  });
});
