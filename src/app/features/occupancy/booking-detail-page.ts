import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toast } from '@spartan-ng/brain/sonner';
import { BuildingService } from '../../domain/buildings/building.service';
import { BookingService } from '../../domain/bookings/booking.service';
import type { BookingStatus } from '../../domain/bookings/booking.types';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { HasPermission } from '../../shared/directives/has-permission.directive';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-booking-detail-page',
  imports: [PageHeader, DtStatusChip, HlmButton, HasPermission, DtEmptyState, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-detail-page.html',
})
export class BookingDetailPage {
  readonly bookingId = input.required<string>();

  private readonly bookingService = inject(BookingService);
  private readonly buildingService = inject(BuildingService);
  private readonly maintenanceService = inject(MaintenanceService);

  protected readonly booking = computed(() => this.bookingService.booking(this.bookingId()));
  protected readonly building = computed(() =>
    this.buildingService.building(this.booking()?.buildingId),
  );
  protected readonly floor = computed(() => this.buildingService.floor(this.booking()?.floorId));
  protected readonly space = computed(() =>
    this.buildingService
      .spacesForBuilding(this.booking()?.buildingId ?? '')
      .find((s) => s.id === this.booking()?.spaceId),
  );

  protected readonly cleaningTicket = computed(() =>
    this.maintenanceService.requests().find((r) => r.bookingId === this.booking()?.id),
  );

  protected readonly needsNoShowDecision = computed(() => {
    const booking = this.booking();
    if (!booking || booking.status !== 'reserved') return false;
    return booking.checkOutDate < new Date().toISOString().slice(0, 10);
  });

  protected readonly errorMessage = signal('');
  protected readonly updating = signal(false);

  protected readonly nextActions = computed<
    { label: string; action: () => Promise<void>; successMessage: string; danger?: boolean }[]
  >(() => {
    const booking = this.booking();
    if (!booking) return [];
    const status: BookingStatus = booking.status;
    const actions: {
      label: string;
      action: () => Promise<void>;
      successMessage: string;
      danger?: boolean;
    }[] = [];
    if (status === 'reserved') {
      actions.push({
        label: 'Check In',
        action: () => this.bookingService.checkIn(booking.id),
        successMessage: `Checked in ${booking.guestName}`,
      });
      if (this.needsNoShowDecision()) {
        actions.push({
          label: 'Mark No-Show',
          action: () => this.bookingService.markNoShow(booking.id),
          successMessage: `Marked ${booking.guestName} as a no-show`,
          danger: true,
        });
      }
      actions.push({
        label: 'Cancel',
        action: () => this.bookingService.cancel(booking.id),
        successMessage: `Booking for ${booking.guestName} cancelled`,
        danger: true,
      });
    } else if (status === 'checked-in') {
      actions.push({
        label: 'Check Out',
        action: () => this.bookingService.checkOut(booking.id),
        successMessage: `Checked out ${booking.guestName}`,
      });
    }
    return actions;
  });

  protected async run(item: {
    action: () => Promise<void>;
    successMessage: string;
  }): Promise<void> {
    this.updating.set(true);
    this.errorMessage.set('');
    try {
      await item.action();
      toast.success(item.successMessage);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Could not update this booking.',
      );
    } finally {
      this.updating.set(false);
    }
  }
}
