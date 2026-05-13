import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import HomeownerVerifyPage from "../../pages/HomeownerVerifyPage";

vi.mock("../../services/listing", () => ({
  requestHomeownerVerification: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import * as listing from "../../services/listing";
import toast from "react-hot-toast";

const mockRequest = listing.requestHomeownerVerification as ReturnType<typeof vi.fn>;

function renderPage() {
  return render(<HomeownerVerifyPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequest.mockResolvedValue({ ok: { id: "VER_1" } });
});

describe("HomeownerVerifyPage", () => {
  it("renders heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /verify ownership/i })).toBeDefined();
  });

  it("renders all required fields", () => {
    renderPage();
    expect(screen.getByLabelText(/street address/i)).toBeDefined();
    expect(screen.getByLabelText(/parcel number/i)).toBeDefined();
    expect(screen.getByLabelText(/contact email/i)).toBeDefined();
  });

  it("shows county appraiser links", () => {
    renderPage();
    expect(screen.getByText(/volusia county/i)).toBeDefined();
    expect(screen.getByText(/flagler county/i)).toBeDefined();
  });

  it("submits with correct values", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByLabelText(/parcel number/i), { target: { value: "7001-00-00-0010" } });
    fireEvent.change(screen.getByLabelText(/contact email/i), { target: { value: "owner@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /submit verification/i }));
    await waitFor(() => expect(mockRequest).toHaveBeenCalledWith("123 Main St", "7001-00-00-0010", "owner@example.com"));
  });

  it("shows success state after submission", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByLabelText(/parcel number/i), { target: { value: "7001-00-00-0010" } });
    fireEvent.change(screen.getByLabelText(/contact email/i), { target: { value: "owner@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /submit verification/i }));
    await waitFor(() => expect(screen.getByText(/request submitted/i)).toBeDefined());
  });

  it("shows error toast on canister err", async () => {
    mockRequest.mockResolvedValue({ err: { InvalidInput: "bad parcel" } });
    renderPage();
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByLabelText(/parcel number/i), { target: { value: "bad" } });
    fireEvent.change(screen.getByLabelText(/contact email/i), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: /submit verification/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.queryByText(/request submitted/i)).toBeNull();
  });
});
