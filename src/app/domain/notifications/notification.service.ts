import { Injectable, computed, inject, resource } from '@angular/core';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { NOTIFICATION_FIXTURES } from './notification.fixtures';
import { NotificationPreferencesService } from './notification-preferences.service';
import type { AppNotification } from './notification.types';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly preferencesService = inject(NotificationPreferencesService);

  private readonly notificationsResource = resource({
    defaultValue: [] as AppNotification[],
    loader: async () => {
      await simulateLatency(250);
      return NOTIFICATION_FIXTURES;
    },
  });

  readonly notifications = this.notificationsResource.value;

  readonly visibleNotifications = computed(() =>
    this.notifications().filter((n) => this.preferencesService.isEnabled(n.type)),
  );

  readonly unreadCount = computed(() => this.visibleNotifications().filter((n) => !n.read).length);

  markRead(id: string): void {
    this.notificationsResource.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  markAllRead(): void {
    this.notificationsResource.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  create(input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): void {
    const notification: AppNotification = {
      ...input,
      id: `n${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.notificationsResource.update((list) => [notification, ...list]);
  }
}
