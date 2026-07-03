import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'order' | 'version' | 'chat' | 'system';
  isRead: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => void;
  addNotification: (title: string, body: string, type: 'order' | 'version' | 'chat' | 'system') => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Version Upgrade: v1.2.0 Released!',
    body: 'We have updated Clude Kitchen with premium biometrics, safe storage checks, direct support chat options, and performance fixes.',
    timestamp: 'Just now',
    type: 'version',
    isRead: false
  },
  {
    id: 'notif-2',
    title: 'Welcome to Clude Kitchen!',
    body: 'Explore dynamic food menus and freshly prepared tiffins from Noida’s top verified home tiffin partners.',
    timestamp: '2 hours ago',
    type: 'system',
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'Order Delivered Successfully',
    body: 'Your tiffin order from Rumali By Enoki has been dropped off. Rate your chef now!',
    timestamp: 'Yesterday',
    type: 'order',
    isRead: true
  }
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: defaultNotifications,
  unreadCount: defaultNotifications.filter(n => !n.isRead).length,

  fetchNotifications: () => {
    const list = get().notifications;
    set({ unreadCount: list.filter(n => !n.isRead).length });
  },

  addNotification: (title, body, type) => {
    const newNotif: NotificationItem = {
      id: 'notif-' + Math.floor(Math.random() * 100000),
      title,
      body,
      timestamp: 'Just now',
      type,
      isRead: false
    };

    set(state => {
      const updated = [newNotif, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.isRead).length
      };
    });
  },

  markAllAsRead: () => {
    set(state => {
      const updated = state.notifications.map(n => ({ ...n, isRead: true }));
      return {
        notifications: updated,
        unreadCount: 0
      };
    });
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0
    });
  }
}));
