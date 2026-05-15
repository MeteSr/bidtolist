import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AgentRegisterPage from "../../pages/AgentRegisterPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../services/agent", () => ({
  registerAgent: vi.fn(),
  getMyAgentProfile: vi.fn(),
  updateAgentProfile: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

import * as agentService from "../../services/agent";
import toast from "react-hot-toast";

const mockRegister = agentService.registerAgent as ReturnType<typeof vi.fn>;
const mockGetProfile = agentService.getMyAgentProfile as ReturnType<typeof vi.fn>;
const mockUpdate = agentService.updateAgentProfile as ReturnType<typeof vi.fn>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const VERIFIED_PROFILE = {
  name: "Jane Smith", brokerage: "KW Realty", licenseNumber: "SL3001",
  county: "Volusia", bio: "Bio text", phone: "3865550100", email: "jane@kw.com",
  isVerified: true, avgDaysOnMarket: 0, listingsLast12Months: 0,
  createdAt: 0, updatedAt: 0, serviceCities: ["daytona beach"],
};
const PENDING_PROFILE = { ...VERIFIED_PROFILE, isVerified: false };

const SMALL_PHOTO  = new File([new Uint8Array(100)], "id.jpg",      { type: "image/jpeg" });
const SMALL_LICENSE = new File([new Uint8Array(200)], "license.pdf", { type: "application/pdf" });
const BIG_FILE      = new File([new Uint8Array(900_000)], "big.jpg",  { type: "image/jpeg" });

function authAs(opts: { isAuthenticated?: boolean; isLoading?: boolean; login?: () => Promise<void> } = {}) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: opts.isAuthenticated ?? true,
    isLoading: opts.isLoading ?? false,
    login: opts.login ?? vi.fn(),
  });
}

async function fillTextFields() {
  fireEvent.change(screen.getByPlaceholderText("Jane Smith"),            { target: { value: "Jane Smith" } });
  fireEvent.change(screen.getByPlaceholderText("Keller Williams Realty"),{ target: { value: "KW Realty" } });
  fireEvent.change(screen.getByPlaceholderText("SL3XXXXXX"),             { target: { value: "SL3001" } });
  fireEvent.change(screen.getByPlaceholderText("(386) 555-0100"),        { target: { value: "3865550100" } });
  fireEvent.change(screen.getByPlaceholderText("jane@brokerage.com"),    { target: { value: "jane@kw.com" } });
}

async function uploadBothFiles() {
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText(/photo.?id/i),        SMALL_PHOTO);
  await user.upload(screen.getByLabelText(/agent.*license/i),   SMALL_LICENSE);
}

async function addServiceCity(city = "Daytona Beach") {
  const user = userEvent.setup();
  const input = screen.getByPlaceholderText(/type a city/i);
  await user.type(input, city);
  await user.keyboard("{Enter}");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AgentRegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue(null);
    mockRegister.mockResolvedValue({ ok: PENDING_PROFILE });
    mockUpdate.mockResolvedValue({ ok: PENDING_PROFILE });
  });

  // ── Page states ──────────────────────────────────────────────────────────────

  it("shows loading indicator while auth is resolving", () => {
    authAs({ isLoading: true });
    render(<AgentRegisterPage />);
    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("shows form with sign-in prompt when unauthenticated", async () => {
    authAs({ isAuthenticated: false });
    render(<AgentRegisterPage />);
    await waitFor(() => expect(screen.getByText("Agent Sign Up")).toBeTruthy());
    expect(screen.getByText(/sign in with Internet Identity/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
  });

  it("calls login() when the Sign In button is clicked", async () => {
    const login = vi.fn();
    authAs({ isAuthenticated: false, login });
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByRole("button", { name: /sign in/i }));
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("shows registration form when authenticated and no profile exists", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => expect(screen.getByText("Agent Sign Up")).toBeTruthy());
    expect(screen.getByRole("button", { name: /create agent profile/i })).toBeTruthy();
  });

  it("shows pending state when profile exists and isVerified=false", async () => {
    authAs();
    mockGetProfile.mockResolvedValue(PENDING_PROFILE);
    render(<AgentRegisterPage />);
    await waitFor(() => expect(screen.getByText("Under Review")).toBeTruthy());
    expect(screen.getByText("Jane Smith")).toBeTruthy();
  });

  it("shows submitted info fields in pending state", async () => {
    authAs();
    mockGetProfile.mockResolvedValue(PENDING_PROFILE);
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Under Review"));
    expect(screen.getByText("SL3001")).toBeTruthy();
    expect(screen.getByText("KW Realty")).toBeTruthy();
  });

  it("shows verified state when profile isVerified=true", async () => {
    authAs();
    mockGetProfile.mockResolvedValue(VERIFIED_PROFILE);
    render(<AgentRegisterPage />);
    await waitFor(() => expect(screen.getByText("Verified Agent")).toBeTruthy());
    expect(screen.getByRole("link", { name: /browse listings/i })).toBeTruthy();
  });

  it("Browse Listings link points to /agents/browse", async () => {
    authAs();
    mockGetProfile.mockResolvedValue(VERIFIED_PROFILE);
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Verified Agent"));
    const link = screen.getByRole("link", { name: /browse listings/i }) as HTMLAnchorElement;
    expect(link.href).toContain("/agents/browse");
  });

  it("getMyAgentProfile rejection falls back to form state", async () => {
    authAs();
    mockGetProfile.mockRejectedValue(new Error("canister unreachable"));
    render(<AgentRegisterPage />);
    await waitFor(() => expect(screen.getByText("Agent Sign Up")).toBeTruthy());
  });

  // ── Document upload inputs ────────────────────────────────────────────────────

  it("renders photo ID and license document file inputs", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    expect(screen.getByLabelText(/photo.?id/i)).toBeTruthy();
    expect(screen.getByLabelText(/agent.*license/i)).toBeTruthy();
  });

  it("photo ID input accepts images and PDF", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    const input = screen.getByLabelText(/photo.?id/i) as HTMLInputElement;
    expect(input.accept).toContain("image/jpeg");
    expect(input.accept).toContain("application/pdf");
  });

  it("license document input accepts images and PDF", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    const input = screen.getByLabelText(/agent.*license/i) as HTMLInputElement;
    expect(input.accept).toContain("image/jpeg");
    expect(input.accept).toContain("application/pdf");
  });

  // ── Submit disabled states ────────────────────────────────────────────────────

  it("submit button is disabled when unauthenticated", async () => {
    authAs({ isAuthenticated: false });
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    const btn = screen.getByRole("button", { name: /create agent profile/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("submit button is disabled when authenticated but no files selected", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    const btn = screen.getByRole("button", { name: /create agent profile/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("submit button is disabled when only photo ID is selected", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    await userEvent.setup().upload(screen.getByLabelText(/photo.?id/i), SMALL_PHOTO);
    const btn = screen.getByRole("button", { name: /create agent profile/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("submit button is disabled when only license doc is selected", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    await userEvent.setup().upload(screen.getByLabelText(/agent.*license/i), SMALL_LICENSE);
    const btn = screen.getByRole("button", { name: /create agent profile/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("submit button is enabled when authenticated and both files selected", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    await uploadBothFiles();
    const btn = screen.getByRole("button", { name: /create agent profile/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  // ── File size validation ──────────────────────────────────────────────────────

  it("shows error and rejects photo ID over 800 KB", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    await userEvent.setup().upload(screen.getByLabelText(/photo.?id/i), BIG_FILE);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("800"));
    // input should be cleared — button stays disabled
    const btn = screen.getByRole("button", { name: /create agent profile/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("shows error and rejects license doc over 800 KB", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));
    await userEvent.setup().upload(screen.getByLabelText(/agent.*license/i), BIG_FILE);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("800"));
    const btn = screen.getByRole("button", { name: /create agent profile/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // ── Submission with blobs ─────────────────────────────────────────────────────

  it("passes photoIdDoc and licenseDoc as Uint8Array to registerAgent", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));

    await fillTextFields();
    await addServiceCity();
    await uploadBothFiles();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create agent profile/i }));
    });

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    const args = mockRegister.mock.calls[0][0];
    expect(args.photoIdDoc).toBeInstanceOf(Uint8Array);
    expect(args.licenseDoc).toBeInstanceOf(Uint8Array);
    expect(args.photoIdDoc.length).toBe(100);
    expect(args.licenseDoc.length).toBe(200);
  });

  it("transitions to pending state after successful registration with documents", async () => {
    authAs();
    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));

    await fillTextFields();
    await addServiceCity();
    await uploadBothFiles();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create agent profile/i }));
    });

    await waitFor(() => expect(screen.getByText("Under Review")).toBeTruthy());
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("submitted"));
  });

  it("handles AlreadyExists error by showing pending state", async () => {
    authAs();
    mockGetProfile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(PENDING_PROFILE);
    mockRegister.mockResolvedValue({ err: { AlreadyExists: null } });

    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));

    await addServiceCity();
    await uploadBothFiles();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create agent profile/i }));
    });

    await waitFor(() => expect(screen.getByText("Under Review")).toBeTruthy());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows toast.error for non-AlreadyExists errors", async () => {
    authAs();
    mockRegister.mockResolvedValue({ err: { NotAuthorized: null } });

    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Agent Sign Up"));

    await addServiceCity();
    await uploadBothFiles();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create agent profile/i }));
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByText("Agent Sign Up")).toBeTruthy();
  });

  // ── Pending state update form ─────────────────────────────────────────────────

  it("calls updateAgentProfile from pending state update form", async () => {
    authAs();
    mockGetProfile.mockResolvedValue(PENDING_PROFILE);
    mockUpdate.mockResolvedValue({ ok: { ...PENDING_PROFILE, phone: "0000000000" } });

    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Under Review"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /update profile/i }));
    });

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith("Profile updated.");
  });

  it("shows toast.error when updateAgentProfile fails", async () => {
    authAs();
    mockGetProfile.mockResolvedValue(PENDING_PROFILE);
    mockUpdate.mockResolvedValue({ err: { NotAuthorized: null } });

    render(<AgentRegisterPage />);
    await waitFor(() => screen.getByText("Under Review"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /update profile/i }));
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
