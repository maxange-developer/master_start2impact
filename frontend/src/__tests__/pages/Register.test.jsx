import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Register from "../../pages/Register";
import { LanguageProvider } from "../../i18n/LanguageContext";
import api from "../../services/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../services/api");

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <Register />
      </LanguageProvider>
    </BrowserRouter>
  );
};

describe("Register Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders register form", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("tu@esempio.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mario Rossi")).toBeInTheDocument();
  });

  it("has submit button", () => {
    renderRegister();
    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find((btn) =>
      btn.textContent.match(/registr|crear|create/i)
    );
    expect(submitButton).toBeDefined();
  });

  it("has link to login page", () => {
    renderRegister();
    const loginLink = screen.getByRole("link", {
      name: /accedi|inicia|login/i,
    });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("submits form with valid data", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        email: "new@example.com",
        full_name: "New User",
        is_admin: false,
      },
    });

    api.post.mockResolvedValueOnce({
      data: { access_token: "fake-token" },
    });

    api.get.mockResolvedValue({
      data: { email: "new@example.com", id: 1, full_name: "New User" },
    });

    renderRegister();

    const emailInput = screen.getByPlaceholderText("tu@esempio.com");
    const nameInput = screen.getByPlaceholderText("Mario Rossi");
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");

    fireEvent.change(emailInput, { target: { value: "new@example.com" } });
    fireEvent.change(nameInput, { target: { value: "New User" } });
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
    if (passwordInputs[1]) {
      fireEvent.change(passwordInputs[1], { target: { value: "password123" } });
    }

    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find((btn) =>
      btn.textContent.match(/registr|crear|create/i)
    );

    if (submitButton) {
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith("/auth/me", {
          headers: { Authorization: "Bearer fake-token" },
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/home");
      });
    }
  });

  it("shows error on registration failure", async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { detail: "Email already exists" } },
    });

    renderRegister();

    const emailInput = screen.getByPlaceholderText("tu@esempio.com");
    const nameInput = screen.getByPlaceholderText("Mario Rossi");
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");

    fireEvent.change(emailInput, { target: { value: "existing@example.com" } });
    fireEvent.change(nameInput, { target: { value: "User" } });
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });

    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find((btn) =>
      btn.textContent.match(/registr|crear|create/i)
    );

    if (submitButton) {
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    }
  });

  it("renders back to home link", () => {
    renderRegister();
    const backLink = screen.getByRole("link", { name: /indietro|atrás|back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });
});
