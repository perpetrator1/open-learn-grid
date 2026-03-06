import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { notificationsApi } from "@/lib/notifications-api";
import { useNotificationStore } from "@/stores/notification.store";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const { notifications, setNotifications, markAsRead, markAllRead, dismiss, setUnreadCount } =
    useNotificationStore();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.list({ page_size: 50 } as never);
      setNotifications(data.results ?? [], 0);
      const unread = await notificationsApi.unreadCount();
      setUnreadCount(unread.count);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleMarkAllRead = async () => {
    markAllRead();
    await notificationsApi.markRead({ all: true });
    setUnreadCount(0);
  };

  const handleDismiss = async (id: number) => {
    dismiss(id);
    await notificationsApi.dismiss({ ids: [id] });
  };

  const handleMarkRead = async (n: Notification) => {
    if (!n.is_read) {
      markAsRead(n.id);
      await notificationsApi.markRead({ ids: [n.id] });
    }
  };

  const filtered =
    tab === "unread"
      ? notifications.filter((n) => !n.is_read && !n.is_dismissed)
      : tab === "all"
      ? notifications.filter((n) => !n.is_dismissed)
      : notifications.filter((n) => n.is_dismissed);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/notifications/preferences">Preferences</Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread{" "}
            {notifications.filter((n) => !n.is_read && !n.is_dismissed).length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {notifications.filter((n) => !n.is_read && !n.is_dismissed).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-1">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No notifications here</p>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border transition-colors",
                  !n.is_read ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/30" : "bg-card"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", !n.is_read && "font-semibold")}>
                    {n.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => handleMarkRead(n)}
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      View →
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMarkRead(n)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => handleDismiss(n.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
