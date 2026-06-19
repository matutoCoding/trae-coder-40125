export type SeatStatus = 'free' | 'occupied' | 'selected' | 'waiting' | 'disabled';

export type SeatType = 'standard' | 'window' | 'single' | 'sofa';

export interface Seat {
  id: string;
  code: string;
  row: number;
  col: number;
  type: SeatType;
  status: SeatStatus;
  zone: string;
}

export type RateType = 'peak' | 'offpeak' | 'normal';

export interface TimeRate {
  id: string;
  name: string;
  type: RateType;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  dayOfWeek: number[];
}

export interface Booking {
  id: string;
  seatId: string;
  seatCode: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  status: 'reserved' | 'checkedin' | 'completed' | 'cancelled' | 'timeout';
  createdAt: string;
  checkinTime?: string;
  checkoutTime?: string;
  timeoutMinutes: number;
}

export interface WaitingItem {
  id: string;
  seatId?: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  queuePosition: number;
  status: 'waiting' | 'notified' | 'confirmed' | 'cancelled' | 'expired';
  createdAt: string;
  notifiedAt?: string;
}

export interface BillingSegment {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  rateType: RateType;
  rateName: string;
  unitPrice: number;
  subtotal: number;
}

export interface Bill {
  id: string;
  bookingId: string;
  seatCode: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  segments: BillingSegment[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  paidAt?: string;
}
