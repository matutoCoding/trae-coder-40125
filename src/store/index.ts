import { create } from 'zustand';
import type { Seat, Booking, WaitingItem, Bill, TimeRate } from '@/types';
import { seatList } from '@/data/seats';
import { bookings as bookingMock } from '@/data/bookings';
import { waitingList as waitingMock } from '@/data/waiting';
import { bills as billsMock } from '@/data/bills';
import { timeRates as ratesMock } from '@/data/rates';
import { calculateBillingSegments, calculateTotalAmount } from '@/utils/billing';

const nowStr = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

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
  checkin: (id: string) => void;
  markAway: (id: string) => void;
  markBack: (id: string) => void;
  checkout: (id: string) => void;
  addWaiting: (seatId?: string) => WaitingItem | null;
  cancelWaiting: (id: string) => void;
  confirmWaiting: (id: string) => Booking | null;
  releaseTimeoutSeats: () => string[];
  releaseAwayTimeout: () => string[];
  addSeat: (seat: Omit<Seat, 'id'>) => void;
  updateSeat: (id: string, data: Partial<Seat>) => void;
  toggleSeatEnabled: (id: string) => void;
  addRate: (rate: Omit<TimeRate, 'id'>) => void;
  updateRate: (id: string, data: Partial<TimeRate>) => void;
  toggleRateEnabled: (id: string) => void;
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
    if (!seat || seat.status === 'occupied' || seat.status === 'disabled' || !seat.enabled) return;
    set({ selectedSeatId: selectedSeatId === id ? null : id });
  },

  bookSeat: () => {
    const { selectedSeatId, seats, selectedDate, startTime, endTime, rates } = get();
    if (!selectedSeatId) return null;
    const seat = seats.find((s) => s.id === selectedSeatId);
    if (!seat) return null;

    const startFull = `${selectedDate} ${startTime}`;
    const endFull = `${selectedDate} ${endTime}`;
    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      seatId: seat.id,
      seatCode: seat.code,
      userId: 'u_001',
      userName: '张小满',
      startTime: startFull,
      endTime: endFull,
      status: 'reserved',
      createdAt: nowStr(),
      timeoutMinutes: 15,
      awayTimeoutMinutes: 30
    };

    const enabledRates = rates.filter((r) => r.enabled);
    const segments = calculateBillingSegments(startFull, endFull, enabledRates);
    const totalMinutes = segments.reduce((s, x) => s + x.durationMinutes, 0);
    const totalAmount = calculateTotalAmount(segments);

    const newBill: Bill = {
      id: `bill_${Date.now()}`,
      bookingId: newBooking.id,
      seatCode: seat.code,
      userId: 'u_001',
      userName: '张小满',
      startTime: startFull,
      endTime: endFull,
      totalMinutes,
      segments,
      totalAmount,
      status: 'pending',
      createdAt: nowStr()
    };

    set((state) => ({
      bookings: [...state.bookings, newBooking],
      seats: state.seats.map((s) =>
        s.id === selectedSeatId ? { ...s, status: 'occupied' as const } : s
      ),
      bills: [...state.bills, newBill],
      selectedSeatId: null
    }));

    console.log('[Booking] 预订成功+账单已生成:', newBooking.id, '金额:', totalAmount);
    return newBooking;
  },

  cancelBooking: (id) => {
    set((state) => {
      const booking = state.bookings.find((b) => b.id === id);
      if (!booking) return state;
      const seatId = booking.seatId;
      return {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled' as const } : b
        ),
        seats: state.seats.map((s) =>
          s.id === seatId ? { ...s, status: 'free' as const } : s
        ),
        bills: state.bills.map((bl) =>
          bl.bookingId === id ? { ...bl, status: 'refunded' as const } : bl
        )
      };
    });
    const { waitingList } = get();
    const booking = get().bookings.find((b) => b.id === id);
    if (booking) {
      tryAutoNotify(booking.seatId, waitingList, set);
    }
    console.log('[Booking] 取消预约:', id);
  },

  checkin: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'checkedin' as const, checkinTime: nowStr() } : b
      )
    }));
    console.log('[Booking] 签到成功:', id);
  },

  markAway: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'away' as const, awayAt: nowStr() } : b
      )
    }));
    console.log('[Booking] 标记暂离:', id);
  },

  markBack: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'checkedin' as const, awayAt: undefined } : b
      )
    }));
    console.log('[Booking] 返回座位:', id);
  },

  checkout: (id) => {
    set((state) => {
      const booking = state.bookings.find((b) => b.id === id);
      if (!booking) return state;
      return {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: 'completed' as const, checkoutTime: nowStr() } : b
        ),
        seats: state.seats.map((s) =>
          s.id === booking.seatId ? { ...s, status: 'free' as const } : s
        ),
        bills: state.bills.map((bl) =>
          bl.bookingId === id ? { ...bl, status: 'paid' as const, paidAt: nowStr() } : bl
        )
      };
    });
    const booking = get().bookings.find((b) => b.id === id);
    if (booking) {
      tryAutoNotify(booking.seatId, get().waitingList, set);
    }
    console.log('[Booking] 离座结算:', id);
  },

  addWaiting: (seatId) => {
    const { waitingList, selectedDate, startTime, endTime } = get();
    const targetList = seatId ? waitingList.filter((w) => w.seatId === seatId && (w.status === 'waiting' || w.status === 'notified')) : waitingList.filter((w) => !w.seatId && (w.status === 'waiting' || w.status === 'notified'));
    const position = targetList.length + 1;

    const item: WaitingItem = {
      id: `w_${Date.now()}`,
      seatId,
      userId: 'u_001',
      userName: '张小满',
      startTime: `${selectedDate} ${startTime}`,
      endTime: `${selectedDate} ${endTime}`,
      queuePosition: position,
      status: 'waiting',
      createdAt: nowStr()
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

  confirmWaiting: (id) => {
    const { seats, rates, waitingList } = get();
    const item = waitingList.find((w) => w.id === id);
    if (!item || item.status !== 'notified') return null;

    const targetSeatId = item.seatId || findFreeSeatId(seats);
    if (!targetSeatId) return null;

    const seat = seats.find((s) => s.id === targetSeatId);
    if (!seat || (seat.status !== 'free' && seat.status !== 'occupied')) return null;

    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      seatId: seat.id,
      seatCode: seat.code,
      userId: item.userId,
      userName: item.userName,
      startTime: item.startTime,
      endTime: item.endTime,
      status: 'reserved',
      createdAt: nowStr(),
      timeoutMinutes: 15,
      awayTimeoutMinutes: 30
    };

    const enabledRates = rates.filter((r) => r.enabled);
    const segments = calculateBillingSegments(item.startTime, item.endTime, enabledRates);
    const totalMinutes = segments.reduce((s, x) => s + x.durationMinutes, 0);
    const totalAmount = calculateTotalAmount(segments);

    const newBill: Bill = {
      id: `bill_${Date.now()}`,
      bookingId: newBooking.id,
      seatCode: seat.code,
      userId: item.userId,
      userName: item.userName,
      startTime: item.startTime,
      endTime: item.endTime,
      totalMinutes,
      segments,
      totalAmount,
      status: 'pending',
      createdAt: nowStr()
    };

    set((state) => ({
      waitingList: state.waitingList.map((w) =>
        w.id === id ? { ...w, status: 'confirmed' as const } : w
      ),
      bookings: [...state.bookings, newBooking],
      bills: [...state.bills, newBill],
      seats: state.seats.map((s) =>
        s.id === targetSeatId ? { ...s, status: 'occupied' as const } : s
      )
    }));

    console.log('[Waiting] 补位确认成功，生成预约:', newBooking.id);
    return newBooking;
  },

  releaseTimeoutSeats: () => {
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

      const updatedBills = state.bills.map((bl) => {
        const matchingBooking = state.bookings.find((b) => b.id === bl.bookingId);
        if (matchingBooking && released.includes(matchingBooking.seatId) && bl.status === 'pending') {
          return { ...bl, status: 'refunded' as const };
        }
        return bl;
      });

      return { bookings: updatedBookings, seats: updatedSeats, bills: updatedBills };
    });

    released.forEach((seatId) => {
      tryAutoNotify(seatId, get().waitingList, set);
    });

    if (released.length > 0) {
      console.log('[Timeout] 预约超时释放:', released);
    }
    return released;
  },

  releaseAwayTimeout: () => {
    const now = Date.now();
    const released: string[] = [];

    set((state) => {
      const updatedBookings = state.bookings.map((b) => {
        if (b.status === 'away' && b.awayAt) {
          const awayMs = new Date(b.awayAt.replace(' ', 'T')).getTime();
          if (now - awayMs > b.awayTimeoutMinutes * 60 * 1000) {
            released.push(b.seatId);
            return { ...b, status: 'timeout' as const, checkoutTime: nowStr() };
          }
        }
        return b;
      });

      const updatedSeats = state.seats.map((s) =>
        released.includes(s.id) ? { ...s, status: 'free' as const } : s
      );

      return { bookings: updatedBookings, seats: updatedSeats };
    });

    released.forEach((seatId) => {
      tryAutoNotify(seatId, get().waitingList, set);
    });

    if (released.length > 0) {
      console.log('[Timeout] 暂离超时释放:', released);
    }
    return released;
  },

  addSeat: (data) => {
    const id = `seat_${Date.now()}`;
    set((state) => ({ seats: [...state.seats, { ...data, id }] }));
    console.log('[SeatAdmin] 新增座位:', id);
  },

  updateSeat: (id, data) => {
    set((state) => ({
      seats: state.seats.map((s) => (s.id === id ? { ...s, ...data } : s))
    }));
    console.log('[SeatAdmin] 更新座位:', id);
  },

  toggleSeatEnabled: (id) => {
    set((state) => {
      const seat = state.seats.find((s) => s.id === id);
      if (!seat) return state;
      const newEnabled = !seat.enabled;
      return {
        seats: state.seats.map((s) =>
          s.id === id
            ? {
                ...s,
                enabled: newEnabled,
                status: newEnabled ? 'free' : ('disabled' as const)
              }
            : s
        )
      };
    });
    console.log('[SeatAdmin] 切换座位启用:', id);
  },

  addRate: (data) => {
    const id = `rate_${Date.now()}`;
    set((state) => ({ rates: [...state.rates, { ...data, id }] }));
    console.log('[RateAdmin] 新增费率:', id);
  },

  updateRate: (id, data) => {
    set((state) => ({
      rates: state.rates.map((r) => (r.id === id ? { ...r, ...data } : r))
    }));
    console.log('[RateAdmin] 更新费率:', id);
  },

  toggleRateEnabled: (id) => {
    set((state) => ({
      rates: state.rates.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    }));
    console.log('[RateAdmin] 切换费率启用:', id);
  }
}));

function findFreeSeatId(seats: Seat[]): string | null {
  const free = seats.find((s) => s.status === 'free' && s.enabled);
  return free ? free.id : null;
}

function tryAutoNotify(
  seatId: string,
  waitingList: WaitingItem[],
  set: (fn: (state: any) => any) => void
) {
  const candidates = waitingList
    .filter((w) => w.status === 'waiting' && (!w.seatId || w.seatId === seatId))
    .sort((a, b) => a.queuePosition - b.queuePosition);

  if (candidates.length === 0) return;

  const next = candidates[0];
  set((state: any) => ({
    waitingList: state.waitingList.map((w: WaitingItem) =>
      w.id === next.id
        ? { ...w, status: 'notified' as const, notifiedAt: nowStr() }
        : w
    )
  }));
  console.log('[AutoNotify] 座位释放，自动通知候补:', next.id, '目标:', seatId);
}
