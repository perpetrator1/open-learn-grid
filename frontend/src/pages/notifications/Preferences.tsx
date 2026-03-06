import { useEffect, useState } from "react";
import { Bell, Mail, Smartphone } from "lucide-react";
import { notificationsApi } from "@/lib/notifications-api";
import type { NotificationPreference } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_LABELS: Record<string, string> = {
  role_assigned: "Role assigned",
  role_removed: "Role removed",
  material_verified: "Material verified",
  material_rejected: "Material rejected",
  material_request_approved: "Material request approved",
  material_request_rejected: "Material request rejected",
  academic_request_approved: "Academic request approved",
  academic_request_rejected: "Academic request rejected",
  report_filed: "Report filed",
  report_resolved: "Report resolved",
  ban_issued: "Account restriction",
  ban_lifted: "Restriction lifted",
  new_material_in_subject: "New material in a subject",
  mention: "Mention",
  system_announcement: "System announcement",
};

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.getPreferences().then(setPrefs).finally(() => setLoading(false));
  }, []);

  const updatePref = async (
    type: string,
    key: "email_enabled" | "in_app_enabled" | "push_enabled",
    value: boolean
  ) => {
    setPrefs((p) =>
      p.map((x) => (x.notification_type === type ? { ...x, [key]: value } : x))
    );
    await notificationsApi.updatePreference(type, { [key]: value });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>Event</span>
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>
          <span className="flex items-center gap-1"><Bell className="h-3 w-3" /> In-app</span>
          <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> Push</span>
        </div>

        {prefs.map((pref) => (
          <div
            key={pref.notification_type}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 border-t hover:bg-muted/30"
          >
            <span className="text-sm">
              {TYPE_LABELS[pref.notification_type] ?? pref.notification_type_display}
            </span>
            <Switch
              checked={pref.email_enabled}
              onCheckedChange={(v) => updatePref(pref.notification_type, "email_enabled", v)}
            />
            <Switch
              checked={pref.in_app_enabled}
              onCheckedChange={(v) => updatePref(pref.notification_type, "in_app_enabled", v)}
            />
            <Switch
              checked={pref.push_enabled}
              onCheckedChange={(v) => updatePref(pref.notification_type, "push_enabled", v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
