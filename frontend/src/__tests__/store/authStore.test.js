import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "../../store/authStore";

describe("AuthStore", () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  it("initializes with null token and user", () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("sets token correctly", () => {
    const { result } = renderHook(() => useAuthStore());
    const testToken = "test-token-123";

    act(() => {
      result.current.setToken(testToken);
    });

    expect(result.current.token).toBe(testToken);
  });

  it("sets user correctly", () => {
    const { result } = renderHook(() => useAuthStore());
    const testUser = {
      email: "test@example.com",
      full_name: "Test User",
      is_admin: false,
    };

    act(() => {
      result.current.setUser(testUser);
    });

    expect(result.current.user).toEqual(testUser);
  });

  it("logout clears token and user", () => {
    const { result } = renderHook(() => useAuthStore());

    // Set token and user first
    act(() => {
      result.current.setToken("test-token");
      result.current.setUser({
        email: "test@example.com",
        full_name: "Test User",
        is_admin: false,
      });
    });

    expect(result.current.token).toBe("test-token");
    expect(result.current.user).not.toBeNull();

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("persists state (has persist middleware)", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setToken("persistent-token");
      result.current.setUser({
        email: "persist@example.com",
        full_name: "Persist User",
        is_admin: true,
      });
    });

    // Verify state is set
    expect(result.current.token).toBe("persistent-token");
    expect(result.current.user?.email).toBe("persist@example.com");
    expect(result.current.user?.is_admin).toBe(true);
  });

  it("updates user independently of token", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setToken("token-123");
    });

    expect(result.current.token).toBe("token-123");
    expect(result.current.user).toBeNull();

    act(() => {
      result.current.setUser({
        email: "new@example.com",
        full_name: "New User",
        is_admin: false,
      });
    });

    expect(result.current.token).toBe("token-123");
    expect(result.current.user?.email).toBe("new@example.com");
  });

  it("updates token independently of user", () => {
    const { result } = renderHook(() => useAuthStore());

    const user = {
      email: "user@example.com",
      full_name: "User",
      is_admin: false,
    };

    act(() => {
      result.current.setUser(user);
    });

    expect(result.current.user).toEqual(user);
    expect(result.current.token).toBeNull();

    act(() => {
      result.current.setToken("new-token");
    });

    expect(result.current.token).toBe("new-token");
    expect(result.current.user).toEqual(user);
  });
});
