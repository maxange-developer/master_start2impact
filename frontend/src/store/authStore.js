/**
 * Authentication State Store - Zustand
 *
 * Global authentication state management with localStorage persistence.
 * Stores JWT token and user information across page refreshes.
 *
 * State:
 * - token (string|null): JWT authentication token
 * - user (Object|null): Current user data (id, email, is_admin, etc.)
 *
 * Actions:
 * - setToken(token): Update JWT token
 * - setUser(user): Update user data
 * - logout(): Clear token and user (reset auth state)
 *
 * Persistence:
 * - Stored in localStorage as 'auth-storage'
 * - Automatically rehydrated on page load
 * - Survives browser refresh
 *
 * Usage:
 * ```jsx
 * const { token, user, setToken, logout } = useAuthStore();
 * ```
 *
 * Technical Notes:
 * - Uses Zustand persist middleware
 * - Token checked in ProtectedRoute for access control
 * - User object includes is_admin flag for role-based UI
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
