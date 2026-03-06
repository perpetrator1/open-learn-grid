import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification } from "@/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  setNotifications: (ns: Notification[], unreadCount: number) => void;
  markAsRead: (id: number) => void;
  markAllRead: () => void;
  dismiss: (id: number) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (n) =>
        set((state) => ({
          notifications: [n, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + (n.is_read ? 0 : 1),
        })),

      setNotifications: (ns, unreadCount) =>
        set({ notifications: ns, unreadCount }),

      markAsRead: (id) =>
        set((state) => {
          const n = state.notifications.find((x) => x.id === id);
          if (!n || n.is_read) return state;
          return {
            notifications: state.notifications.map((x) =>
              x.id === id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        }),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            is_read: true,
            read_at: n.read_at ?? new Date().toISOString(),
          })),
          unreadCount: 0,
        })),

      dismiss: (id) =>
        set((state) => {
          const n = state.notifications.find((x) => x.id === id);
          return {
            notifications: state.notifications.filter((x) => x.id !== id),
            unreadCount: n && !n.is_read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        }),

      setUnreadCount: (count) => set({ unreadCount: count }),
    }),
    {
      name: "notifications-storage",
      partialize: (state) => ({ unreadCount: state.unreadCount }),
    }
  )
);
