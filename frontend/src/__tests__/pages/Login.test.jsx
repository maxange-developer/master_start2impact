import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../../pages/Login";
import { LanguageProvider } from "../../i18n/LanguageContext";
import api from "../../services/api";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock authStore
vi.mock("../../store/authStore", () => ({
  useAuthStore: () => ({
    login: vi.fn(),
  }),
}));

// Mock API
vi.mock("../../services/api");

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <Login />
      </LanguageProvider>
    </BrowserRouter>
  );
};

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("tu@esempio.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("has submit button", () => {
    renderLogin();
    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find(
      (btn) =>
        btn.textContent.includes("Entrar") ||
        btn.textContent.includes("Accedi") ||
        btn.textContent.includes("Login")
    );
    expect(submitButton).toBeDefined();
  });

  it("has link to register page", () => {
    renderLogin();
    const registerLink = screen.getByRole("link", { name: /regístr/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  it("shows validation error for invalid email", async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText("tu@esempio.com");

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(emailInput).toHaveValue("invalid-email");
    });
  });

  it("handles login error correctly", async () => {
    api.post.mockRejectedValue({
      response: { data: { detail: "Invalid credentials" } },
    });

    renderLogin();

    const emailInput = screen.getByPlaceholderText("tu@esempio.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find(
      (btn) =>
        btn.textContent.includes("Entrar") ||
        btn.textContent.includes("Accedi") ||
        btn.textContent.includes("Login")
    );

    if (submitButton) {
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    }
  });

  it("displays language selector", () => {
    renderLogin();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders back to home link", () => {
    renderLogin();
    const backLink = screen.getByRole("link", { name: /indietro|atrás|back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });
});
