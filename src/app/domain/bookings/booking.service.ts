import { Injectable, Injector, inject, resource, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { BuildingService } from '../buildings/building.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { BOOKING_FIXTURES } from './booking.fixtures';
import type { Booking, BookingFilter, BookingStatus, NewBookingInput } from './booking.types';

const ACTIVE_STATUSES: BookingStatus[] = ['reserved', 'checked-in'];

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly buildingService = inject(BuildingService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly injector = inject(Injector);

  private readonly bookingsResource = resource({
    defaultValue: [] as Booking[],
    loader: async () => {
      await simulateLatency();
      return BOOKING_FIXTURES;
    },
  });

  readonly bookings = this.bookingsResource.value;
  readonly bookingsLoading = this.bookingsResource.isLoading;

  private readonly pendingIds = signal<Set<string>>(new Set());

  isPending(id: string): boolean {
    return this.pendingIds().has(id);
  }

  private async ready(): Promise<void> {
    if (!this.bookingsLoading()) return;
    await firstValueFrom(
      toObservable(this.bookingsLoading, { injector: this.injector }).pipe(
        filter((loading) => !loading),
      ),
    );
  }

  booking(id: string | null | undefined): Booking | undefined {
    if (!id) return undefined;
    return this.bookings().find((b) => b.id === id);
  }

  filtered(filters: BookingFilter): Booking[] {
    const search = filters.search?.trim().toLowerCase();
    return this.bookings().filter((b) => {
      if (search) {
        const space = this.buildingService.floor(b.floorId)?.name ?? '';
        const haystack = `${b.guestName} ${space}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.status && b.status !== filters.status) return false;
      if (filters.buildingId && b.buildingId !== filters.buildingId) return false;
      return true;
    });
  }

  bookingsForLocation(spaceId: string): Booking[] {
    return this.bookings()
      .filter((b) => b.spaceId === spaceId)
      .sort((a, b) => (a.checkInDate < b.checkInDate ? 1 : -1));
  }

  currentBookingFor(spaceId: string): Booking | undefined {
    const today = new Date().toISOString().slice(0, 10);
    const bookings = this.bookingsForLocation(spaceId);
    const checkedIn = bookings.find((b) => b.status === 'checked-in');
    if (checkedIn) return checkedIn;
    return bookings.find(
      (b) => b.status === 'reserved' && b.checkInDate <= today && today < b.checkOutDate,
    );
  }

  private assertNoOverlap(
    spaceId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeId?: string,
  ): void {
    const conflict = this.bookings().find(
      (b) =>
        b.id !== excludeId &&
        b.spaceId === spaceId &&
        ACTIVE_STATUSES.includes(b.status) &&
        overlaps(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate),
    );
    if (conflict) {
      throw new Error(`This space is already booked for ${conflict.guestName} in that date range.`);
    }
  }

  async create(input: NewBookingInput): Promise<Booking> {
    if (input.checkOutDate <= input.checkInDate) {
      throw new Error('Check-out date must be after check-in date.');
    }
    await this.ready();
    this.assertNoOverlap(input.spaceId, input.checkInDate, input.checkOutDate);
    await simulateLatency(400);
    const now = new Date().toISOString();
    const created: Booking = {
      ...input,
      id: `bk${Date.now().toString(36)}`,
      status: 'reserved',
      createdBy: 'You',
      createdAt: now,
      updatedAt: now,
    };
    this.bookingsResource.update((list) => [created, ...list]);
    return created;
  }

  async update(id: string, patch: Partial<NewBookingInput>): Promise<void> {
    const existing = this.booking(id);
    if (!existing) return;
    if (existing.status !== 'reserved') {
      throw new Error('Only a reserved booking can be edited.');
    }
    const checkInDate = patch.checkInDate ?? existing.checkInDate;
    const checkOutDate = patch.checkOutDate ?? existing.checkOutDate;
    if (checkOutDate <= checkInDate) {
      throw new Error('Check-out date must be after check-in date.');
    }
    this.assertNoOverlap(patch.spaceId ?? existing.spaceId, checkInDate, checkOutDate, id);
    await this.mutate(id, () => ({
      ...patch,
      checkInDate,
      checkOutDate,
      updatedAt: new Date().toISOString(),
    }));
  }

  async checkIn(id: string): Promise<void> {
    const existing = this.booking(id);
    if (!existing) return;
    if (existing.status !== 'reserved') {
      throw new Error('Only a reserved booking can be checked in.');
    }
    await this.mutate(id, () => ({ status: 'checked-in', updatedAt: new Date().toISOString() }));
  }

  async checkOut(id: string): Promise<void> {
    const existing = this.booking(id);
    if (!existing) return;
    if (existing.status !== 'checked-in') {
      throw new Error('Only a checked-in booking can be checked out.');
    }
    await this.mutate(id, () => ({
      status: 'checked-out',
      needsCleaning: true,
      updatedAt: new Date().toISOString(),
    }));

    const spaceName = this.buildingService
      .spacesForFloor(existing.floorId ?? '')
      .find((s) => s.id === existing.spaceId)?.name;
    await this.maintenanceService.create({
      title: `Post-checkout cleaning — ${spaceName ?? 'room'}`,
      description: `Guest ${existing.guestName} checked out — room needs cleaning before the next stay.`,
      buildingId: existing.buildingId,
      floorId: existing.floorId,
      spaceId: existing.spaceId,
      priority: 'low',
      category: 'general',
      bookingId: existing.id,
    });
  }

  async cancel(id: string): Promise<void> {
    const existing = this.booking(id);
    if (!existing) return;
    if (existing.status !== 'reserved') {
      throw new Error('Only a reserved booking can be cancelled.');
    }
    await this.mutate(id, () => ({ status: 'cancelled', updatedAt: new Date().toISOString() }));
  }

  async markNoShow(id: string): Promise<void> {
    const existing = this.booking(id);
    if (!existing) return;
    if (existing.status !== 'reserved') {
      throw new Error('Only a reserved booking can be marked as a no-show.');
    }
    await this.mutate(id, () => ({ status: 'no-show', updatedAt: new Date().toISOString() }));
  }

  private async mutate(id: string, patch: (existing: Booking) => Partial<Booking>): Promise<void> {
    this.pendingIds.update((s) => new Set(s).add(id));
    try {
      await simulateLatency(300);
      this.bookingsResource.update((list) =>
        list.map((b) => (b.id === id ? { ...b, ...patch(b) } : b)),
      );
    } finally {
      this.pendingIds.update((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  }

  occupancyRateSeries(
    buildingId: string | '',
    days: string[],
  ): { labels: string[]; values: number[] } {
    const spaces = buildingId
      ? this.buildingService.spacesForBuilding(buildingId)
      : this.buildingService
          .buildings()
          .flatMap((b) => this.buildingService.spacesForBuilding(b.id));
    const totalSpaces = spaces.length;
    const bookings = this.bookings().filter(
      (b) =>
        (!buildingId || b.buildingId === buildingId) &&
        (b.status === 'checked-in' || b.status === 'checked-out'),
    );
    const values = days.map((day) => {
      if (totalSpaces === 0) return 0;
      const occupiedSpaceIds = new Set(
        bookings.filter((b) => b.checkInDate <= day && day < b.checkOutDate).map((b) => b.spaceId),
      );
      return Math.round((occupiedSpaceIds.size / totalSpaces) * 100);
    });
    return { labels: days, values };
  }
}
