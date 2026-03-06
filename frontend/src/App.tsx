import { lazy, Suspense } from "react"
import { NavLink, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"
import { USER_PERMISSIONS, ACADEMIC_PERMISSIONS, MATERIAL_PERMISSIONS, FEDERATION_PERMISSIONS } from "@/lib/permissions"
import { MODERATION_PERMISSIONS } from "@/lib/permissions"
import { NotificationBell } from "@/components/notifications/NotificationBell"

// Pages — loaded lazily so each route becomes its own JS chunk
const About = lazy(() => import("@/pages/About"))
const Home = lazy(() => import("@/pages/Home"))
const NotFound = lazy(() => import("@/pages/NotFound"))
const LoginPage = lazy(() => import("@/pages/auth/Login"))
const RegisterPage = lazy(() => import("@/pages/auth/Register"))
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmail"))
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPassword"))
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPassword"))
const ProfileSettingsPage = lazy(() => import("@/pages/settings/Profile"))
const SecuritySettingsPage = lazy(() => import("@/pages/settings/Security"))
const AdminRolesPage = lazy(() => import("@/pages/admin/Roles"))
const AcademicAdminPage = lazy(() => import("@/pages/admin/Academic"))
const AuditLogPage = lazy(() => import("@/pages/admin/AuditLog"))
const BrowsePage = lazy(() => import("@/pages/materials/Browse"))
const UploadPage = lazy(() => import("@/pages/materials/Upload"))
const DetailPage = lazy(() => import("@/pages/materials/Detail"))
const NotificationsPage = lazy(() => import("@/pages/notifications/Index"))
const NotificationPreferencesPage = lazy(() => import("@/pages/notifications/Preferences"))
const VerificationQueuePage = lazy(() => import("@/pages/verification/Queue"))
const ModerationPage = lazy(() => import("@/pages/moderation/Index"))
const StudentDashboard = lazy(() => import("@/pages/dashboard/Student"))
const TeacherDashboard = lazy(() => import("@/pages/dashboard/Teacher"))
const AdminDashboard = lazy(() => import("@/pages/dashboard/Admin"))
const FederationAdminPage = lazy(() => import("@/pages/admin/Federation"))
const SetupWizard = lazy(() => import("@/pages/setup/Wizard"))

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
          {isAuthenticated && can(ACADEMIC_PERMISSIONS.MANAGE_CURRICULUM) && (
            <NavLink to="/admin/academic" className={navLinkClass}>
              Academic
            </NavLink>
          )}
          <NavLink to="/materials" className={navLinkClass}>
            Materials
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              {can(MODERATION_PERMISSIONS.VIEW_REPORTS) && (
                <NavLink to="/moderation" className={navLinkClass}>
                  Moderation
                </NavLink>
              )}
              {can(MATERIAL_PERMISSIONS.APPROVE) && (
                <NavLink to="/verification/queue" className={navLinkClass}>
                  Queue
                </NavLink>
              )}
              {can(FEDERATION_PERMISSIONS.MANAGE_INSTANCES) && (
                <NavLink to="/admin/federation" className={navLinkClass}>
                  Federation
                </NavLink>
              )}              
              <NotificationBell />
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

      {/* Protected — academic management */}
      <Route
        path="/admin/academic"
        element={
          <ProtectedRoute permission={ACADEMIC_PERMISSIONS.MANAGE_CURRICULUM}>
            <AcademicAdminPage />
          </ProtectedRoute>
        }
      />

      {/* Materials — public browse + detail */}
      <Route path="/materials" element={<BrowsePage />} />

      {/* Materials — protected upload (before :id so static wins) */}
      <Route
        path="/materials/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />

      <Route path="/materials/:id" element={<DetailPage />} />

      {/* Notifications */}
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/notifications/preferences" element={<ProtectedRoute><NotificationPreferencesPage /></ProtectedRoute>} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin" element={<ProtectedRoute permission={USER_PERMISSIONS.MANAGE_ROLES}><AdminDashboard /></ProtectedRoute>} />

      {/* Verification */}
      <Route
        path="/verification/queue"
        element={<ProtectedRoute permission={MATERIAL_PERMISSIONS.APPROVE}><VerificationQueuePage /></ProtectedRoute>}
      />

      {/* Moderation */}
      <Route
        path="/moderation"
        element={<ProtectedRoute permission={MODERATION_PERMISSIONS.VIEW_REPORTS}><ModerationPage /></ProtectedRoute>}
      />

      {/* Admin */}
      <Route
        path="/admin/audit-log"
        element={<ProtectedRoute permission={USER_PERMISSIONS.VIEW_AUDIT_LOG}><AuditLogPage /></ProtectedRoute>}
      />
      <Route
        path="/admin/federation"
        element={<ProtectedRoute permission={FEDERATION_PERMISSIONS.MANAGE_INSTANCES}><FederationAdminPage /></ProtectedRoute>}
      />

      {/* Setup wizard — public */}
      <Route path="/setup" element={<SetupWizard />} />

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
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              </div>
            }
          >
            <AppRoutes />
          </Suspense>
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App

