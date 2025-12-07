import React from "react";
import {
  render,
  screen,
  renderHook,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LanguageProvider, useLanguage } from "../../i18n/LanguageContext";

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("LanguageContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("LanguageProvider", () => {
    it("provides default language as Spanish when no localStorage value", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.language).toBe("es");
    });

    it("loads language from localStorage if available", () => {
      localStorage.setItem("language", "it");

      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.language).toBe("it");
    });

    it("loads English from localStorage", () => {
      localStorage.setItem("language", "en");

      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current.language).toBe("en");
    });

    it("saves language to localStorage when changed", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.changeLanguage("it");
      });

      expect(localStorage.getItem("language")).toBe("it");
    });

    it("changes language to English and persists", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.changeLanguage("en");
      });

      expect(result.current.language).toBe("en");
      expect(localStorage.getItem("language")).toBe("en");
    });

    it("changes language to Italian and persists", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.changeLanguage("it");
      });

      expect(result.current.language).toBe("it");
      expect(localStorage.getItem("language")).toBe("it");
    });

    it("does not change language for invalid language code", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      const initialLanguage = result.current.language;

      act(() => {
        result.current.changeLanguage("fr"); // lingua non supportata
      });

      expect(result.current.language).toBe(initialLanguage);
    });

    it("does not change language for undefined language code", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      const initialLanguage = result.current.language;

      act(() => {
        result.current.changeLanguage(undefined);
      });

      expect(result.current.language).toBe(initialLanguage);
    });

    it("does not change language for null language code", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      const initialLanguage = result.current.language;

      act(() => {
        result.current.changeLanguage(null);
      });

      expect(result.current.language).toBe(initialLanguage);
    });
  });

  describe("Translation function (t)", () => {
    it("translates simple keys correctly", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.changeLanguage("it");
      });

      // Test translation for Italian
      const welcomeText = result.current.t("landing.hero.title");
      expect(welcomeText).toBeDefined();
      expect(typeof welcomeText).toBe("string");
    });

    it("translates nested keys correctly", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.changeLanguage("en");
      });

      const translation = result.current.t("landing.hero.subtitle");
      expect(translation).toBeDefined();
      expect(typeof translation).toBe("string");
    });

    it("returns key when translation not found", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      const missingKey = "nonexistent.key.path";
      const translation = result.current.t(missingKey);
      expect(translation).toBe(missingKey);
    });

    it("handles deeply nested translation keys", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      act(() => {
        result.current.changeLanguage("es");
      });

      const translation = result.current.t("landing.features.feature1.title");
      expect(translation).toBeDefined();
      expect(typeof translation).toBe("string");
    });

    it("translates correctly for all supported languages", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      // Test Italian
      act(() => {
        result.current.changeLanguage("it");
      });
      expect(result.current.t("landing.hero.title")).toBeDefined();

      // Test Spanish
      act(() => {
        result.current.changeLanguage("es");
      });
      expect(result.current.t("landing.hero.title")).toBeDefined();

      // Test English
      act(() => {
        result.current.changeLanguage("en");
      });
      expect(result.current.t("landing.hero.title")).toBeDefined();
    });
  });

  describe("useLanguage hook", () => {
    it("throws error when used outside LanguageProvider", () => {
      // Capture console.error to avoid test noise
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useLanguage());
      }).toThrow("useLanguage must be used within LanguageProvider");

      console.error = originalError;
    });

    it("provides language context when used inside provider", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current.language).toBeDefined();
      expect(result.current.changeLanguage).toBeDefined();
      expect(result.current.t).toBeDefined();
    });

    it("provides working changeLanguage function", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(typeof result.current.changeLanguage).toBe("function");

      act(() => {
        result.current.changeLanguage("it");
      });

      expect(result.current.language).toBe("it");
    });

    it("provides working translation function", () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: LanguageProvider,
      });

      expect(typeof result.current.t).toBe("function");

      const translation = result.current.t("landing.hero.title");
      expect(typeof translation).toBe("string");
    });
  });

  describe("Integration with components", () => {
    it("renders children correctly", () => {
      render(
        <LanguageProvider>
          <div data-testid="test-child">Test Content</div>
        </LanguageProvider>
      );

      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("provides context to multiple children", () => {
      const TestComponent = () => {
        const { language } = useLanguage();
        return <div data-testid="lang-display">{language}</div>;
      };

      render(
        <LanguageProvider>
          <TestComponent />
          <TestComponent />
        </LanguageProvider>
      );

      const displays = screen.getAllByTestId("lang-display");
      expect(displays).toHaveLength(2);
      displays.forEach((display) => {
        expect(display.textContent).toBe("es"); // default
      });
    });

    it("updates all consumers when language changes", () => {
      const TestComponent = () => {
        const { language, changeLanguage } = useLanguage();
        return (
          <div>
            <span data-testid="current-lang">{language}</span>
            <button onClick={() => changeLanguage("it")}>Change</button>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId("current-lang").textContent).toBe("es");

      act(() => {
        screen.getByText("Change").click();
      });

      expect(screen.getByTestId("current-lang").textContent).toBe("it");
    });
  });
});
