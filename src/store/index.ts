import { create } from 'zustand';
import type { Seat, Booking, WaitingItem, Bill, TimeRate } from '@/types';
import { seatList } from '@/data/seats';
import { bookings as bookingMock } from '@/data/bookings';
import { waitingList as waitingMock } from '@/data/waiting';
import { bills as billsMock } from '@/data/bills';
import { timeRates as ratesMock } from '@/data/rates';

interface StudyRoomStore {
  seats: Seat[];
  bookings: Booking[];
  waitingList: WaitingItem[];
  bills: Bill[];
  rates: TimeRate[];
  selectedSeatId: string | null;
  selectedDate: string;
  startTime: string;
  endTime: string;

  setSelectedSeat: (id: string | null) => void;
  setSelectedDate: (d: string) => void;
  setStartTime: (t: string) => void;
  setEndTime: (t: string) => void;
  toggleSeatSelection: (id: string) => void;
  bookSeat: () => Booking | null;
  cancelBooking: (id: string) => void;
  addWaiting: (seatId?: string) => WaitingItem | null;
  cancelWaiting: (id: string) => void;
  notifyNextWaiting: () => WaitingItem | null;
  releaseTimeoutSeats: () => string[];
}

export const useStudyRoomStore = create<StudyRoomStore>((set, get) => ({
  seats: seatList,
  bookings: bookingMock,
  waitingList: waitingMock,
  bills: billsMock,
  rates: ratesMock,
  selectedSeatId: null,
  selectedDate: new Date().toISOString().slice(0, 10),
  startTime: '09:00',
  endTime: '12:00',

  setSelectedSeat: (id) => set({ selectedSeatId: id }),
  setSelectedDate: (d) => set({ selectedDate: d }),
  setStartTime: (t) => set({ startTime: t }),
  setEndTime: (t) => set({ endTime: t }),

  toggleSeatSelection: (id) => {
    const { seats, selectedSeatId } = get();
    const seat = seats.find((s) => s.id === id);
    if (!seat || seat.status === 'occupied' || seat.status === 'disabled') return;
    set({ selectedSeatId: selectedSeatId === id ? null : id });
  },

  bookSeat: () => {
    const { selectedSeatId, seats, selectedDate, startTime, endTime } = get();
    if (!selectedSeatId) return null;
    const seat = seats.find((s) => s.id === selectedSeatId);
    if (!seat) return null;

    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      seatId: seat.id,
      seatCode: seat.code,
      userId: 'u_001',
      userName: '张小满',
      startTime: `${selectedDate} ${startTime}`,
      endTime: `${selectedDate} ${endTime}`,
      status: 'reserved',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      timeoutMinutes: 15
    };

    set((state) => ({
      bookings: [...state.bookings, newBooking],
      seats: state.seats.map((s) =>
        s.id === selectedSeatId ? { ...s, status: 'occupied' as const } : s
      ),
      selectedSeatId: null
    }));

    console.log('[Booking] 座位预订成功:', newBooking);
    return newBooking;
  },

  cancelBooking: (id) => {
    set((state) => {
      const booking = state.bookings.find((b) => b.id === id);
      return {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled' as const } : b
        ),
        seats: booking
          ? state.seats.map((s) =>
              s.id === booking.seatId ? { ...s, status: 'free' as const } : s
            )
          : state.seats
      };
    });
    console.log('[Booking] 取消预订:', id);
  },

  addWaiting: (seatId) => {
    const { waitingList, selectedDate, startTime, endTime } = get();
    const globalWaiting = waitingList.filter((w) => !w.seatId);
    const seatWaiting = seatId ? waitingList.filter((w) => w.seatId === seatId) : [];
    const position = (seatId ? seatWaiting.length : globalWaiting.length) + 1;

    const item: WaitingItem = {
      id: `w_${Date.now()}`,
      seatId,
      userId: 'u_001',
      userName: '张小满',
      startTime: `${selectedDate} ${startTime}`,
      endTime: `${selectedDate} ${endTime}`,
      queuePosition: position,
      status: 'waiting',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    set((state) => ({ waitingList: [...state.waitingList, item] }));
    console.log('[Waiting] 候补登记:', item);
    return item;
  },

  cancelWaiting: (id) => {
    set((state) => ({
      waitingList: state.waitingList.map((w) =>
        w.id === id ? { ...w, status: 'cancelled' as const } : w
      )
    }));
    console.log('[Waiting] 取消候补:', id);
  },

  notifyNextWaiting: () => {
    const { waitingList } = get();
    const next = waitingList
      .filter((w) => w.status === 'waiting')
      .sort((a, b) => a.queuePosition - b.queuePosition)[0];
    if (!next) return null;

    const notified: WaitingItem = {
      ...next,
      status: 'notified',
      notifiedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    set((state) => ({
      waitingList: state.waitingList.map((w) => (w.id === next.id ? notified : w))
    }));
    console.log('[Waiting] 补位通知已发送:', notified);
    return notified;
  },

  releaseTimeoutSeats: () => {
    const { bookings } = get();
    const now = Date.now();
    const released: string[] = [];

    set((state) => {
      const updatedBookings = state.bookings.map((b) => {
        if (b.status === 'reserved') {
          const createdMs = new Date(b.createdAt.replace(' ', 'T')).getTime();
          if (now - createdMs > b.timeoutMinutes * 60 * 1000) {
            released.push(b.seatId);
            return { ...b, status: 'timeout' as const };
          }
        }
        return b;
      });

      const updatedSeats = state.seats.map((s) =>
        released.includes(s.id) ? { ...s, status: 'free' as const } : s
      );

      return { bookings: updatedBookings, seats: updatedSeats };
    });

    if (released.length > 0) {
      console.log('[Timeout] 超时释放座位:', released);
    }
    return released;
  }
}));
