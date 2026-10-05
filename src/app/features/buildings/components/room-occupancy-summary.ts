import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUsers } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { BookingService } from '../../../domain/bookings/booking.service';
import { OccupancyService } from '../../../domain/occupancy/occupancy.service';
import type { LocationRef } from '../../../shared/types/canonical.types';
import { HasPermission } from '../../../shared/directives/has-permission.directive';
import { statusLabel, toneForStatus } from '../../../shared/utils/status-tone';
import { RoomStatCard } from './room-stat-card';

@Component({
  selector: 'app-room-occupancy-summary',
  imports: [
    DatePipe,
    NgIcon,
    HasPermission,
    RoomStatCard,
    ...HlmAvatarImports,
    ...HlmButtonImports,
    ...HlmCardImports,
  ],
  providers: [provideIcons({ lucideUsers })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  templateUrl: './room-occupancy-summary.html',
})
export class RoomOccupancySummary {
  readonly location = input.required<LocationRef>();
  readonly compact = input(false);

  private readonly occupancyService = inject(OccupancyService);
  protected readonly bookingService = inject(BookingService);

  protected readonly statusLabel = statusLabel;

  protected readonly reading = computed(() => this.occupancyService.reading(this.location()));
  protected readonly canAct = computed(
    () => this.reading().status === 'reserved' || this.reading().status === 'occupied',
  );
  protected readonly dotColorClass = computed(() => {
    switch (toneForStatus(this.reading().status)) {
      case 'success':
        return 'bg-dashboard-accent';
      case 'info':
        return 'bg-sky-500';
      default:
        return 'bg-muted-foreground/50';
    }
  });

  protected async checkIn(): Promise<void> {
    const bookingId = this.reading().bookingId;
    if (!bookingId) return;
    const guestName = this.reading().guestName;
    try {
      await this.bookingService.checkIn(bookingId);
      toast.success(`Checked in ${guestName ?? 'guest'}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not check in.');
    }
  }

  protected initials(name: string): string {
    return (
      name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?'
    );
  }

  protected async checkOut(): Promise<void> {
    const bookingId = this.reading().bookingId;
    if (!bookingId) return;
    const guestName = this.reading().guestName;
    try {
      await this.bookingService.checkOut(bookingId);
      toast.success(`Checked out ${guestName ?? 'guest'}`, {
        description: 'A cleaning ticket was created.',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not check out.');
    }
  }
}
