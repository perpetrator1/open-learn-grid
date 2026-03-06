import { NavLink, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"
import { USER_PERMISSIONS } from "@/lib/permissions"

// Pages
import About from "@/pages/About"
import Home from "@/pages/Home"
import NotFound from "@/pages/NotFound"
import LoginPage from "@/pages/auth/Login"
import RegisterPage from "@/pages/auth/Register"
import VerifyEmailPage from "@/pages/auth/VerifyEmail"
import ForgotPasswordPage from "@/pages/auth/ForgotPassword"
import ResetPasswordPage from "@/pages/auth/ResetPassword"
import ProfileSettingsPage from "@/pages/settings/Profile"
import SecuritySettingsPage from "@/pages/settings/Security"
import AdminRolesPage from "@/pages/admin/Roles"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors",
    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
  )

function AppNav() {
  const { isAuthenticated, user, logout, can } = useAuth()

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="text-sm font-semibold tracking-wide">Open Learn Grid</div>
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            Status
          </NavLink>
          {isAuthenticated && can(USER_PERMISSIONS.MANAGE_ROLES) && (
            <NavLink to="/admin/roles" className={navLinkClass}>
              Roles
            </NavLink>
          )}
          {isAuthenticated ? (
            <>
              <NavLink to="/settings/profile" className={navLinkClass}>
                {user?.display_name || user?.username}
              </NavLink>
              <button
                onClick={() => logout()}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={navLinkClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected — authenticated users */}
      <Route
        path="/settings/profile"
        element={
          <ProtectedRoute>
            <ProfileSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/security"
        element={
          <ProtectedRoute>
            <SecuritySettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Protected — role management */}
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute permission={USER_PERMISSIONS.MANAGE_ROLES}>
            <AdminRolesPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <AppNav />
        <main className="container py-10">
          <AppRoutes />
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App

