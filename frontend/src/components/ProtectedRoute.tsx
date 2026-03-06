import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, the user must be authenticated. */
  requireAuth?: boolean;
  /** If provided, the user must hold this permission. */
  permission?: string;
  /** If provided, the user must hold ALL of these permissions. */
  permissions?: string[];
  /** Redirect destination when the guard fails. Defaults to /login. */
  redirectTo?: string;
}

/**
 * Wrap any route element with <ProtectedRoute> to guard it.
 *
 * Examples:
 *   <ProtectedRoute requireAuth>...</ProtectedRoute>
 *   <ProtectedRoute requireAuth permission="users.manage_roles">...</ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  permission,
  permissions,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const { can, canAll } = usePermission();
  const location = useLocation();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (permission && !can(permission)) {
    return <Navigate to="/" replace />;
  }

  if (permissions && !canAll(permissions)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
