import { create } from "zustand";
import type { AuthState, AuthUser } from "@/types";
import { persist } from "zustand/middleware";
import { useCopilotStore } from "./copilotStore";

interface AuthStore extends AuthState {
  pendingUser: AuthUser | null;

  // Actions
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  setLoading: (isLoading: boolean) => void;
  clearError: () => void;
  setPendingUser: (user: AuthUser | null) => void;
  clearPendingUser: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      role: null,
      isLoading: false,
      pendingUser: null,

      // Actions
      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          role: user.role,
          isLoading: false,
          pendingUser: null,
        });
        useCopilotStore.getState().reset();
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          role: null,
          isLoading: false,
          pendingUser: null,
        });
        useCopilotStore.getState().reset();
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser, role: updatedUser.role });
        }
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      clearError: () => {
        // To be implemented when adding error handling
      },

      setPendingUser: (user) => {
        set({ pendingUser: user });
      },

      clearPendingUser: () => {
        set({ pendingUser: null });
      },
    }),
    {
      name: "auth-storage",
      // Only persist the essential auth data
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        // pendingUser is intentionally transient
      }),
    },
  ),
);
