/**
 * Vitest Testing Environment Setup
 *
 * Global test configuration and DOM API mocks for React component testing.
 * Runs before all test files to provide consistent testing environment.
 *
 * Key Features:
 * - Automatic DOM cleanup after each test
 * - window.matchMedia mock for responsive component tests
 * - IntersectionObserver mock for scroll/lazy-loading tests
 * - Jest DOM matchers for enhanced assertions
 *
 * Mocked APIs:
 * - matchMedia: CSS media query API (always returns non-matching)
 * - IntersectionObserver: Viewport intersection API (no-op implementation)
 *
 * Usage:
 * - Automatically imported by Vitest
 * - No manual import needed in test files
 * - Provides global expect, vi (mock functions)
 *
 * Example Assertions:
 * ```javascript
 * expect(element).toBeInTheDocument();
 * expect(button).toHaveTextContent('Login');
 * expect(input).toHaveValue('test@example.com');
 * ```
 *
 * Technical Notes:
 * - Uses @testing-library/react for cleanup
 * - Uses @testing-library/jest-dom for DOM matchers
 * - Vitest vi for mocking (similar to Jest's jest.fn())
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Cleanup DOM after each test to prevent state leakage
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for lazy-loading and scroll tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;
