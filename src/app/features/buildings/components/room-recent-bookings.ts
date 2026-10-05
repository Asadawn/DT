import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideChevronRight } from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { BookingService } from '../../../domain/bookings/booking.service';
import type { LocationRef } from '../../../shared/types/canonical.types';
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';

@Component({
  selector: 'app-room-recent-bookings',
  imports: [DatePipe, NgIcon, DtStatusChip, RouterLink, ...HlmCardImports, ...HlmAvatarImports],
  providers: [provideIcons({ lucideCalendar, lucideChevronRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  templateUrl: './room-recent-bookings.html',
})
export class RoomRecentBookings {
  readonly location = input.required<LocationRef>();

  private readonly bookingService = inject(BookingService);

  protected readonly recentBookings = computed(() => {
    const spaceId = this.location().spaceId;
    return spaceId ? this.bookingService.bookingsForLocation(spaceId).slice(0, 3) : [];
  });

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
}
