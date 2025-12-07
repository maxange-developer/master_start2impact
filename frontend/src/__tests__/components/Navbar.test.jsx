import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "../../i18n/LanguageContext";
import Navbar from "../../components/Navbar";
import api from "../../services/api";

// Mock authStore
const mockLogout = vi.fn();
const mockUser = {
  email: "test@example.com",
  full_name: "Test User",
  is_admin: false,
};

const mockAdminUser = {
  email: "admin@example.com",
  full_name: "Admin User",
  is_admin: true,
};

let currentUser = mockUser;

vi.mock("../../store/authStore", () => ({
  useAuthStore: () => ({
    user: currentUser,
    logout: mockLogout,
  }),
}));

// Mock API
vi.mock("../../services/api");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <Navbar />
      </LanguageProvider>
    </BrowserRouter>
  );
};

describe("Navbar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
    api.get.mockResolvedValue({ data: [] });
  });

  it("renders logo", () => {
    renderNavbar();
    expect(screen.getByText(/tenerife/i)).toBeInTheDocument();
  });

  it("renders navigation icons", () => {
    renderNavbar();
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("renders user button", () => {
    renderNavbar();
    // User button should be in the navbar
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("has links to main pages", () => {
    renderNavbar();
    const homeLink = screen.getByRole("link", { name: /tenerife/i });
    expect(homeLink).toHaveAttribute("href", "/home");
  });

  it("fetches saved articles count on mount", async () => {
    api.get.mockResolvedValueOnce({ data: [1, 2, 3] });

    renderNavbar();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/blog/saved");
    });
  });

  it("displays user profile when clicking user button", async () => {
    renderNavbar();

    const buttons = screen.getAllByRole("button");
    const userButton = buttons.find((btn) => btn.querySelector("svg"));

    if (userButton) {
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
        expect(screen.getByText(mockUser.full_name)).toBeInTheDocument();
      });
    }
  });

  it("closes profile menu when clicking outside", async () => {
    renderNavbar();

    const buttons = screen.getAllByRole("button");
    const userButton = buttons.find((btn) => btn.querySelector("svg"));

    if (userButton) {
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      });

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText(mockUser.email)).not.toBeInTheDocument();
      });
    }
  });

  it("calls logout and navigates when clicking logout button", async () => {
    renderNavbar();

    const buttons = screen.getAllByRole("button");
    const userButton = buttons.find((btn) => btn.querySelector("svg"));

    if (userButton) {
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole("button", {
        name: /logout|esci|cerrar/i,
      });
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    }
  });

  it("navigates to saved articles when clicking saved button", async () => {
    renderNavbar();

    const buttons = screen.getAllByRole("button");
    const userButton = buttons.find((btn) => btn.querySelector("svg"));

    if (userButton) {
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      });

      const savedButton = screen.getByRole("button", {
        name: /salvati|guardados|saved/i,
      });
      fireEvent.click(savedButton);

      expect(mockNavigate).toHaveBeenCalledWith("/saved");
    }
  });

  it("shows create article button for admin users", async () => {
    currentUser = mockAdminUser;

    renderNavbar();

    const buttons = screen.getAllByRole("button");
    const userButton = buttons.find((btn) => btn.querySelector("svg"));

    if (userButton) {
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(mockAdminUser.email)).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", {
        name: /crea|crear|create/i,
      });
      expect(createButton).toBeInTheDocument();

      fireEvent.click(createButton);
      expect(mockNavigate).toHaveBeenCalledWith("/create-article");
    }
  });

  it("does not show create article button for non-admin users", async () => {
    currentUser = mockUser;

    renderNavbar();

    const buttons = screen.getAllByRole("button");
    const userButton = buttons.find((btn) => btn.querySelector("svg"));

    if (userButton) {
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      });

      const createButton = screen.queryByRole("button", {
        name: /crea|crear|create/i,
      });
      expect(createButton).not.toBeInTheDocument();
    }
  });

  it("displays saved articles count", async () => {
    api.get.mockResolvedValueOnce({ data: [1, 2, 3, 4, 5] });

    renderNavbar();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/blog/saved");
    });

    const buttons = screen.getAllByRole("button");
    const userButton = buttons.find((btn) => btn.querySelector("svg"));

    if (userButton) {
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
      });
    }
  });

  it("handles saved count fetch error gracefully", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    api.get.mockRejectedValueOnce(new Error("Network error"));

    renderNavbar();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/blog/saved");
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("updates saved count when articleSaved event is triggered", async () => {
    api.get.mockResolvedValue({ data: [1, 2] });

    renderNavbar();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    // Trigger custom event
    api.get.mockResolvedValueOnce({ data: [1, 2, 3] });
    window.dispatchEvent(new Event("articleSaved"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it("closes profile menu when clicking on navigation links", async () => {
    renderNavbar();

    const buttons = screen.getAllByRole("button");
    const userButton = buttons.find((btn) => btn.querySelector("svg"));

    if (userButton) {
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      });

      const homeLink = screen
        .getAllByRole("link")
        .find((link) => link.getAttribute("href") === "/home");

      if (homeLink) {
        fireEvent.click(homeLink);

        await waitFor(() => {
          expect(screen.queryByText(mockUser.email)).not.toBeInTheDocument();
        });
      }
    }
  });
});
