import type { NotificationType } from './notification.types';

export interface NotificationPreferences {
  enabledTypes: NotificationType[];
  updatedAt: string;
}
