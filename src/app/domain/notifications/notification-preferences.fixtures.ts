import type { NotificationType } from './notification.types';
import type { NotificationPreferences } from './notification-preferences.types';

export const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'maintenance',
  'device',
  'system',
  'access',
  'automation',
];

export const NOTIFICATION_PREFERENCES_FIXTURE: NotificationPreferences = {
  enabledTypes: [...ALL_NOTIFICATION_TYPES],
  updatedAt: new Date(0).toISOString(),
};
