export type NotificationType = 'maintenance' | 'device' | 'system' | 'access' | 'automation';

export interface NotificationLink {
  route: string[];
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: NotificationLink;
}
