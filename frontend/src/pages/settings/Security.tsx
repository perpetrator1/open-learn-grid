import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { TOTPSetupResponse } from "@/types";

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const passwordChangeSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "At least 8 characters"),
    new_password_confirm: z.string(),
  })
  .refine((d) => d.new_password === d.new_password_confirm, {
    message: "Passwords do not match",
    path: ["new_password_confirm"],
  });

const totpVerifySchema = z.object({
  code: z.string().length(6, "Must be exactly 6 digits"),
});

const totpDisableSchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z.string().length(6, "Must be exactly 6 digits"),
});

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>;
type TOTPVerifyForm = z.infer<typeof totpVerifySchema>;
type TOTPDisableForm = z.infer<typeof totpDisableSchema>;

// ---------------------------------------------------------------------------
// Password Change section
// ---------------------------------------------------------------------------

function PasswordChangeSection() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
  });

  async function onSubmit(data: PasswordChangeForm) {
    setServerError(null);
    setSuccess(false);
    setIsLoading(true);
    try {
      await api.post("/api/auth/password/change/", data);
      reset();
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; old_password?: string[] } } };
      const oldPwErr = e?.response?.data?.old_password?.[0];
      setServerError(oldPwErr ?? e?.response?.data?.detail ?? "Password change failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Change password</h2>

      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {serverError}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          Password changed successfully.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {(["old_password", "new_password", "new_password_confirm"] as const).map((field) => (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
              {field === "old_password" ? "Current password" : field === "new_password" ? "New password" : "Confirm new password"}
            </label>
            <input
              id={field}
              type="password"
              autoComplete={field === "old_password" ? "current-password" : "new-password"}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register(field)}
            />
            {errors[field] && (
              <p className="mt-1 text-xs text-red-600">{errors[field]?.message}</p>
            )}
          </div>
        ))}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Changing…" : "Change password"}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TOTP 2FA section
// ---------------------------------------------------------------------------

function TOTPSection() {
  const { user, refreshProfile } = useAuth();
  const [setup, setSetup] = useState<TOTPSetupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register: registerVerify,
    handleSubmit: handleVerify,
    reset: resetVerify,
    formState: { errors: verifyErrors },
  } = useForm<TOTPVerifyForm>({ resolver: zodResolver(totpVerifySchema) });

  const {
    register: registerDisable,
    handleSubmit: handleDisable,
    reset: resetDisable,
    formState: { errors: disableErrors },
  } = useForm<TOTPDisableForm>({ resolver: zodResolver(totpDisableSchema) });

  async function startSetup() {
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await api.get<TOTPSetupResponse>("/api/auth/2fa/setup/");
      setSetup(data);
    } catch {
      setError("Failed to initiate 2FA setup.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onVerify(data: TOTPVerifyForm) {
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/api/auth/2fa/setup/", data);
      setSetup(null);
      resetVerify();
      setSuccessMsg("2FA enabled successfully.");
      await refreshProfile();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? "Invalid code.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onDisable(data: TOTPDisableForm) {
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/api/auth/2fa/disable/", data);
      resetDisable();
      setSuccessMsg("2FA disabled.");
      await refreshProfile();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? "Failed to disable 2FA.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Two-factor authentication</h2>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            user?.is_2fa_enabled
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {user?.is_2fa_enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {/* Not yet enabled */}
      {!user?.is_2fa_enabled && !setup && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Secure your account with a TOTP authenticator app (e.g. Google Authenticator, Authy).
          </p>
          <Button onClick={startSetup} disabled={isLoading} variant="outline">
            {isLoading ? "Loading…" : "Enable 2FA"}
          </Button>
        </div>
      )}

      {/* Setup in progress — show QR code */}
      {!user?.is_2fa_enabled && setup && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
          </p>
          <img
            src={`data:image/png;base64,${setup.qr_code}`}
            alt="TOTP QR code"
            className="w-48 h-48 border rounded"
          />
          <p className="text-xs text-gray-500 font-mono break-all">
            Manual key: {setup.secret}
          </p>

          <form onSubmit={handleVerify(onVerify)} className="space-y-3">
            <div>
              <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 mb-1">
                Authenticator code
              </label>
              <input
                id="totp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...registerVerify("code")}
              />
              {verifyErrors.code && (
                <p className="mt-1 text-xs text-red-600">{verifyErrors.code.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Verifying…" : "Confirm & enable"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSetup(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Disable */}
      {user?.is_2fa_enabled && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            To disable 2FA, enter your password and a current authenticator code.
          </p>
          <form onSubmit={handleDisable(onDisable)} className="space-y-3">
            <div>
              <label htmlFor="disable-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="disable-password"
                type="password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...registerDisable("password")}
              />
              {disableErrors.password && (
                <p className="mt-1 text-xs text-red-600">{disableErrors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="disable-code" className="block text-sm font-medium text-gray-700 mb-1">
                Authenticator code
              </label>
              <input
                id="disable-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...registerDisable("code")}
              />
              {disableErrors.code && (
                <p className="mt-1 text-xs text-red-600">{disableErrors.code.message}</p>
              )}
            </div>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? "Disabling…" : "Disable 2FA"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SecuritySettingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your password and two-factor authentication.</p>
      </div>

      <PasswordChangeSection />
      <TOTPSection />
    </div>
  );
}
