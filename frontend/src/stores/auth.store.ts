import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  UserProfile,
} from "@/types";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/permissions";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  clearAuth: () => void;

  // Permission helpers (derived from user.permissions)
  can: (permission: string) => boolean;
  canAll: (permissions: string[]) => boolean;
  canAny: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // ------------------------------------------------------------------
      // Login
      // ------------------------------------------------------------------
      login: async (payload) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<LoginResponse>(
            "/api/auth/login/",
            payload
          );
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          set({
            user: data.user,
            accessToken: data.access,
            refreshToken: data.refresh,
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // ------------------------------------------------------------------
      // Register
      // ------------------------------------------------------------------
      register: async (payload) => {
        set({ isLoading: true });
        try {
          await api.post("/api/auth/register/", payload);
        } finally {
          set({ isLoading: false });
        }
      },

      // ------------------------------------------------------------------
      // Logout
      // ------------------------------------------------------------------
      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await api.post("/api/auth/logout/", { refresh: refreshToken });
          }
        } catch {
          // Ignore errors — clear state regardless
        } finally {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      // ------------------------------------------------------------------
      // Refresh the profile (e.g. after updating it)
      // ------------------------------------------------------------------
      refreshProfile: async () => {
        const { data } = await api.get<UserProfile>("/api/auth/profile/");
        set({ user: data });
      },

      // ------------------------------------------------------------------
      // Direct token setter (used by the axios interceptor callback)
      // ------------------------------------------------------------------
      setTokens: (access, refresh) => {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        set({ accessToken: access, refreshToken: refresh });
      },

      clearAuth: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // ------------------------------------------------------------------
      // Permission helpers
      // ------------------------------------------------------------------
      can: (permission) => {
        const { user } = get();
        if (!user) return false;
        return hasPermission(user.permissions, permission);
      },

      canAll: (permissions) => {
        const { user } = get();
        if (!user) return false;
        return hasAllPermissions(user.permissions, permissions);
      },

      canAny: (permissions) => {
        const { user } = get();
        if (!user) return false;
        return hasAnyPermission(user.permissions, permissions);
      },
    }),
    {
      name: "auth",
      // Only persist the tokens + user — don't persist isLoading
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
