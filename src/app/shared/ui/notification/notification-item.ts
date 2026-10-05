import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { AppNotification } from '../../../domain/notifications/notification.types';

const TYPE_ICON: Record<AppNotification['type'], string> = {
  maintenance: '✎',
  device: '◈',
  system: 'ℹ',
  access: '◍',
  automation: '⚡',
};

@Component({
  selector: 'dt-notification-item',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="hover:bg-accent flex w-full cursor-pointer items-start gap-3 rounded-control px-3 py-2 text-left"
      (click)="opened.emit()"
    >
      <span class="mt-0.5 shrink-0 text-base">{{ icon() }}</span>
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="truncate text-sm" [class.font-medium]="!notification().read">{{ notification().title }}</span>
          @if (!notification().read) {
            <span class="bg-primary h-1.5 w-1.5 shrink-0 rounded-full"></span>
          }
        </span>
        <span class="text-muted-foreground block truncate text-xs">{{ notification().message }}</span>
        <span class="text-muted-foreground block text-xs">{{ notification().createdAt | date: 'short' }}</span>
      </span>
    </button>
  `,
})
export class DtNotificationItem {
  readonly notification = input.required<AppNotification>();
  readonly opened = output<void>();

  protected icon(): string {
    return TYPE_ICON[this.notification().type];
  }
}
