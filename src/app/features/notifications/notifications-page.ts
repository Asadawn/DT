import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../domain/notifications/notification.service';
import type { AppNotification } from '../../domain/notifications/notification.types';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { DtNotificationItem } from '../../shared/ui/notification/notification-item';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';

interface FilterTab {
  id: string;
  label: string;
}

const FILTER_TABS: FilterTab[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

interface NotificationGroup {
  label: string;
  items: AppNotification[];
}

@Component({
  selector: 'app-notifications-page',
  imports: [PageHeader, DtNotificationItem, DtEmptyState, HlmButton, ...HlmTabsImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications-page.html',
})
export class NotificationsPage {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly filterTabs = FILTER_TABS;
  protected readonly filter = signal('all');

  protected readonly filtered = computed(() => {
    const all = this.notificationService.notifications();
    return this.filter() === 'unread' ? all.filter((n) => !n.read) : all;
  });

  protected readonly groups = computed<NotificationGroup[]>(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60_000;

    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    for (const n of this.filtered()) {
      const time = new Date(n.createdAt).getTime();
      if (time >= startOfToday) today.push(n);
      else if (time >= startOfYesterday) yesterday.push(n);
      else earlier.push(n);
    }

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Earlier', items: earlier },
    ].filter((g) => g.items.length > 0);
  });

  protected open(notification: AppNotification): void {
    this.notificationService.markRead(notification.id);
    if (notification.link) {
      this.router.navigate(notification.link.route);
    }
  }

  protected markAllRead(): void {
    this.notificationService.markAllRead();
  }
}
