import { useCallback, useEffect } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationStore } from "@/stores/notification.store";
import { useWebSocket } from "@/hooks/useWebSocket";
import { notificationsApi } from "@/lib/notifications-api";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, addNotification, setNotifications, markAsRead, setUnreadCount } =
    useNotificationStore();

  // Load latest on mount
  useEffect(() => {
    notificationsApi
      .list({ is_dismissed: false, page_size: 10 } as never)
      .then((data) => {
        setNotifications(data.results ?? [], data.count ?? 0);
      })
      .catch(() => {});
    notificationsApi.unreadCount().then((d) => setUnreadCount(d.count)).catch(() => {});
  }, [setNotifications, setUnreadCount]);

  const handleWsMessage = useCallback(
    (data: Record<string, unknown>) => {
      if (data.type === "notification") {
        addNotification(data as unknown as Notification);
      } else if (data.type === "unread_count") {
        setUnreadCount(data.count as number);
      }
    },
    [addNotification, setUnreadCount]
  );

  useWebSocket("/ws/notifications/", handleWsMessage);

  const handleMarkRead = async (n: Notification) => {
    if (n.is_read) return;
    markAsRead(n.id);
    await notificationsApi.markRead({ ids: [n.id] }).catch(() => {});
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <Link to="/notifications" className="text-xs text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0",
                  !n.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                )}
              >
                <p className={cn("text-sm font-medium", !n.is_read && "font-semibold")}>
                  {n.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
