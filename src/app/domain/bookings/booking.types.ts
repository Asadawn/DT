export type BookingStatus = 'reserved' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show';

export interface Booking {
  id: string;
  buildingId: string;
  floorId?: string;
  spaceId: string;
  guestName: string;
  numberOfGuests?: number;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  notes?: string;
  needsCleaning?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewBookingInput {
  buildingId: string;
  floorId?: string;
  spaceId: string;
  guestName: string;
  numberOfGuests?: number;
  checkInDate: string;
  checkOutDate: string;
  notes?: string;
}

export interface BookingFilter {
  status?: BookingStatus;
  buildingId?: string;
  search?: string;
}
