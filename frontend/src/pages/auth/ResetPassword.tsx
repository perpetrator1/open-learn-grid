import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    new_password_confirm: z.string(),
  })
  .refine((d) => d.new_password === d.new_password_confirm, {
    message: "Passwords do not match",
    path: ["new_password_confirm"],
  });

type ResetPasswordForm = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(schema) });

  async function onSubmit(data: ResetPasswordForm) {
    setServerError(null);
    setIsLoading(true);
    try {
      await api.post("/api/auth/password/reset/confirm/", { token, ...data });
      navigate("/login", { state: { passwordReset: true } });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setServerError(
        e?.response?.data?.detail ?? "Password reset failed. The link may have expired."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reset password</h1>
          <p className="mt-2 text-sm text-gray-600">Choose a new password for your account.</p>
        </div>

        <div className="bg-white shadow rounded-lg p-8 space-y-4">
          {serverError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                id="new_password"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("new_password")}
              />
              {errors.new_password && (
                <p className="mt-1 text-xs text-red-600">{errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="new_password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                id="new_password_confirm"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("new_password_confirm")}
              />
              {errors.new_password_confirm && (
                <p className="mt-1 text-xs text-red-600">{errors.new_password_confirm.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting…" : "Reset password"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
