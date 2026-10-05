import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../domain/notifications/notification.service';
import type { AppNotification } from '../../../domain/notifications/notification.types';
import { mediaQuerySignal } from '../../utils/media-query.signal';
import { DtNotificationItem } from '../../ui/notification/notification-item';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { TopbarContentService } from './topbar-content.service';

@Component({
  selector: 'dt-topbar',
  imports: [
    NgTemplateOutlet,
    DtNotificationItem,
    ...HlmDropdownMenuImports,
    ...HlmSidebarImports,
    ...HlmAvatarImports,
    ...HlmButtonImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.html',
})
export class Topbar {
  protected readonly isMobile = mediaQuerySignal('(max-width: 768px)', inject(DestroyRef));

  protected readonly topbarContent = inject(TopbarContentService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly recentNotifications = computed(() =>
    [...this.notificationService.visibleNotifications()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  );

  protected openNotification(notification: AppNotification): void {
    this.notificationService.markRead(notification.id);
    if (notification.link) {
      this.router.navigate(notification.link.route);
    }
  }

  protected goToAllNotifications(): void {
    this.router.navigateByUrl('/notifications');
  }

  protected async signOut(): Promise<void> {
    this.authService.signOut();
    await this.router.navigateByUrl('/auth/sign-in');
  }

  protected initials(): string {
    const name = this.authService.currentUser()?.displayName ?? '';
    return (
      name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'DT'
    );
  }
}
