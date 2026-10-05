import type { LocationRef } from '../../shared/types/canonical.types';

export type OccupancyStatus = 'vacant' | 'reserved' | 'occupied';

export interface OccupancyState {
  location: LocationRef;
  status: OccupancyStatus;
  bookingId?: string;
  guestName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  needsCleaning?: boolean;
  lastUpdatedAt: string;
}

export interface OccupancyRollup {
  occupied: number;
  reserved: number;
  vacant: number;
  total: number;
}
