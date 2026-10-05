import { Injectable, inject } from '@angular/core';
import { BookingService } from '../bookings/booking.service';
import type { LocationRef } from '../../shared/types/canonical.types';
import type { OccupancyRollup, OccupancyState } from './occupancy.types';

@Injectable({ providedIn: 'root' })
export class OccupancyService {
  private readonly bookingService = inject(BookingService);

  reading(location: LocationRef): OccupancyState {
    const spaceId = location.spaceId;
    if (!spaceId) return { location, status: 'vacant', lastUpdatedAt: new Date().toISOString() };

    const booking = this.bookingService.currentBookingFor(spaceId);
    if (!booking) return { location, status: 'vacant', lastUpdatedAt: new Date().toISOString() };

    return {
      location,
      status: booking.status === 'checked-in' ? 'occupied' : 'reserved',
      bookingId: booking.id,
      guestName: booking.guestName,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      needsCleaning: booking.needsCleaning,
      lastUpdatedAt: booking.updatedAt,
    };
  }

  rollup(readings: OccupancyState[]): OccupancyRollup {
    return {
      occupied: readings.filter((r) => r.status === 'occupied').length,
      reserved: readings.filter((r) => r.status === 'reserved').length,
      vacant: readings.filter((r) => r.status === 'vacant').length,
      total: readings.length,
    };
  }
}
