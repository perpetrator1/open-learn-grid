import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types";

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(50, "At most 50 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, _, ., - only"),
  display_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});

type ProfileForm = z.infer<typeof schema>;

export default function ProfileSettingsPage() {
  const { user, refreshProfile } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.username ?? "",
      display_name: user?.display_name ?? "",
      bio: user?.bio ?? "",
    },
  });

  async function onSubmit(data: ProfileForm) {
    setServerError(null);
    setSuccess(false);
    setIsLoading(true);
    try {
      await api.patch<UserProfile>("/api/auth/profile/", data);
      await refreshProfile();
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setServerError(e?.response?.data?.detail ?? "Update failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-600 mt-1">Update your public profile information.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        {serverError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {serverError}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            Profile updated successfully.
          </div>
        )}

        {/* Email — read-only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            disabled
            value={user?.email ?? ""}
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            {user?.is_verified_email ? "Verified ✓" : "Not verified"}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("username")}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
              Display name
            </label>
            <input
              id="display_name"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("display_name")}
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("bio")}
            />
            {errors.bio && (
              <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
