import { useAuthStore } from "@/stores/auth.store";

/**
 * Convenience hook — returns the auth state and common actions.
 *
 * Usage:
 *   const { user, isAuthenticated, logout, can } = useAuth();
 */
export function useAuth() {
  return useAuthStore();
}
