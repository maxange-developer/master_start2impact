import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LanguageSelector from "../../i18n/LanguageSelector";
import { useLanguage } from "../../i18n/LanguageContext";

// Mock del LanguageContext
vi.mock("../../i18n/LanguageContext", () => ({
  useLanguage: vi.fn(),
}));

// Mock di react-country-flag
vi.mock("react-country-flag", () => ({
  default: ({ countryCode }) => <div data-testid={`flag-${countryCode}`} />,
}));

describe("LanguageSelector Component", () => {
  const mockChangeLanguage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useLanguage.mockReturnValue({
      language: "it",
      changeLanguage: mockChangeLanguage,
    });
  });

  describe("Navbar Variant", () => {
    it("renders navbar variant by default", () => {
      render(<LanguageSelector />);
      const flags = screen.getAllByTestId("flag-IT");
      expect(flags.length).toBeGreaterThan(0);
    });

    it("renders navbar variant when explicitly set", () => {
      render(<LanguageSelector variant="navbar" />);
      const flags = screen.getAllByTestId("flag-IT");
      expect(flags.length).toBeGreaterThan(0);
    });

    it("displays current language flag for Italian", () => {
      useLanguage.mockReturnValue({
        language: "it",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="navbar" />);
      const flags = screen.getAllByTestId("flag-IT");
      expect(flags.length).toBeGreaterThan(0);
    });

    it("displays current language flag for English", () => {
      useLanguage.mockReturnValue({
        language: "en",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="navbar" />);
      const flags = screen.getAllByTestId("flag-GB");
      expect(flags.length).toBeGreaterThan(0);
    });

    it("displays current language flag for Spanish", () => {
      useLanguage.mockReturnValue({
        language: "es",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="navbar" />);
      const flags = screen.getAllByTestId("flag-ES");
      expect(flags.length).toBeGreaterThan(0);
    });

    it("renders all language options in dropdown", () => {
      render(<LanguageSelector variant="navbar" />);
      expect(screen.getByText("Italiano")).toBeInTheDocument();
      expect(screen.getByText("Español")).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it("calls changeLanguage when clicking on Italian", () => {
      render(<LanguageSelector variant="navbar" />);
      const italianButton = screen.getByText("Italiano");
      fireEvent.click(italianButton);
      expect(mockChangeLanguage).toHaveBeenCalledWith("it");
    });

    it("calls changeLanguage when clicking on English", () => {
      render(<LanguageSelector variant="navbar" />);
      const englishButton = screen.getByText("English");
      fireEvent.click(englishButton);
      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("calls changeLanguage when clicking on Spanish", () => {
      render(<LanguageSelector variant="navbar" />);
      const spanishButton = screen.getByText("Español");
      fireEvent.click(spanishButton);
      expect(mockChangeLanguage).toHaveBeenCalledWith("es");
    });

    it("highlights current language in navbar variant", () => {
      useLanguage.mockReturnValue({
        language: "it",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="navbar" />);
      const italianButton = screen.getByText("Italiano").closest("button");
      expect(italianButton).toHaveClass("bg-gray-100");
    });
  });

  describe("Auth Variant", () => {
    it("renders auth variant correctly", () => {
      render(<LanguageSelector variant="auth" />);
      const flags = screen.getAllByTestId("flag-IT");
      expect(flags.length).toBeGreaterThan(0);
      expect(screen.getByText("IT")).toBeInTheDocument();
    });

    it("displays current language code in uppercase for Italian", () => {
      useLanguage.mockReturnValue({
        language: "it",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="auth" />);
      expect(screen.getByText("IT")).toBeInTheDocument();
    });

    it("displays current language code in uppercase for English", () => {
      useLanguage.mockReturnValue({
        language: "en",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="auth" />);
      expect(screen.getByText("EN")).toBeInTheDocument();
    });

    it("displays current language code in uppercase for Spanish", () => {
      useLanguage.mockReturnValue({
        language: "es",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="auth" />);
      expect(screen.getByText("ES")).toBeInTheDocument();
    });

    it("renders all language options in auth dropdown", () => {
      render(<LanguageSelector variant="auth" />);
      expect(screen.getByText("Italiano")).toBeInTheDocument();
      expect(screen.getByText("Español")).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it("calls changeLanguage when clicking language in auth variant", () => {
      render(<LanguageSelector variant="auth" />);
      const englishButton = screen.getByText("English");
      fireEvent.click(englishButton);
      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("highlights current language in auth variant", () => {
      useLanguage.mockReturnValue({
        language: "es",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="auth" />);
      const spanishButton = screen.getByText("Español").closest("button");
      expect(spanishButton).toHaveClass("bg-gray-100");
    });
  });

  describe("Landing Variant", () => {
    it("renders landing variant correctly", () => {
      render(<LanguageSelector variant="landing" />);
      const flags = screen.getAllByTestId("flag-IT");
      expect(flags.length).toBeGreaterThan(0);
      const italianoTexts = screen.getAllByText("Italiano");
      expect(italianoTexts.length).toBeGreaterThan(0);
    });

    it("displays current language full name for Italian", () => {
      useLanguage.mockReturnValue({
        language: "it",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="landing" />);
      const languageNames = screen.getAllByText("Italiano");
      expect(languageNames.length).toBeGreaterThan(0);
    });

    it("displays current language full name for English", () => {
      useLanguage.mockReturnValue({
        language: "en",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="landing" />);
      const languageNames = screen.getAllByText("English");
      expect(languageNames.length).toBeGreaterThan(0);
    });

    it("displays current language full name for Spanish", () => {
      useLanguage.mockReturnValue({
        language: "es",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="landing" />);
      const languageNames = screen.getAllByText("Español");
      expect(languageNames.length).toBeGreaterThan(0);
    });

    it("renders all language options in landing dropdown", () => {
      render(<LanguageSelector variant="landing" />);
      const italianoButtons = screen.getAllByText("Italiano");
      const espanolButtons = screen.getAllByText("Español");
      const englishButtons = screen.getAllByText("English");
      expect(italianoButtons.length).toBeGreaterThan(0);
      expect(espanolButtons.length).toBeGreaterThan(0);
      expect(englishButtons.length).toBeGreaterThan(0);
    });

    it("calls changeLanguage when clicking language in landing variant", () => {
      render(<LanguageSelector variant="landing" />);
      const languageButtons = screen.getAllByText("English");
      // Click on the dropdown option (second occurrence)
      fireEvent.click(languageButtons[languageButtons.length - 1]);
      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("highlights current language in landing variant", () => {
      useLanguage.mockReturnValue({
        language: "en",
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="landing" />);
      const englishButtons = screen.getAllByText("English");
      // Check the dropdown option (last occurrence)
      const dropdownButton =
        englishButtons[englishButtons.length - 1].closest("button");
      expect(dropdownButton).toHaveClass("bg-gray-100");
    });
  });

  describe("Invalid Variant", () => {
    it("returns null for invalid variant", () => {
      const { container } = render(<LanguageSelector variant="invalid" />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for undefined variant that is not navbar", () => {
      const { container } = render(<LanguageSelector variant="random" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("handles missing currentLang gracefully", () => {
      useLanguage.mockReturnValue({
        language: "fr", // lingua non supportata
        changeLanguage: mockChangeLanguage,
      });
      render(<LanguageSelector variant="navbar" />);
      // Il componente dovrebbe comunque renderizzare senza errori
      expect(screen.getByText("Italiano")).toBeInTheDocument();
    });

    it("renders all flags in navbar variant", () => {
      render(<LanguageSelector variant="navbar" />);
      const flagsIT = screen.getAllByTestId("flag-IT");
      const flagsES = screen.getAllByTestId("flag-ES");
      const flagsGB = screen.getAllByTestId("flag-GB");
      expect(flagsIT.length).toBeGreaterThan(0);
      expect(flagsES.length).toBeGreaterThan(0);
      expect(flagsGB.length).toBeGreaterThan(0);
    });

    it("renders all flags in auth variant", () => {
      render(<LanguageSelector variant="auth" />);
      const flagsIT = screen.getAllByTestId("flag-IT");
      const flagsES = screen.getAllByTestId("flag-ES");
      const flagsGB = screen.getAllByTestId("flag-GB");
      expect(flagsIT.length).toBeGreaterThan(0);
      expect(flagsES.length).toBeGreaterThan(0);
      expect(flagsGB.length).toBeGreaterThan(0);
    });

    it("renders all flags in landing variant", () => {
      render(<LanguageSelector variant="landing" />);
      const flagsIT = screen.getAllByTestId("flag-IT");
      const flagsES = screen.getAllByTestId("flag-ES");
      const flagsGB = screen.getAllByTestId("flag-GB");
      expect(flagsIT.length).toBeGreaterThan(0);
      expect(flagsES.length).toBeGreaterThan(0);
      expect(flagsGB.length).toBeGreaterThan(0);
    });
  });
});
