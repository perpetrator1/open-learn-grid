import { useAuthStore } from "@/stores/auth.store";

/**
 * Returns a function `can(permission)` that checks whether the current user
 * holds the given permission string.
 *
 * Usage:
 *   const { can, canAll, canAny } = usePermission();
 *   if (can("users.manage_roles")) { ... }
 */
export function usePermission() {
  const can = useAuthStore((s) => s.can);
  const canAll = useAuthStore((s) => s.canAll);
  const canAny = useAuthStore((s) => s.canAny);
  return { can, canAll, canAny };
}
