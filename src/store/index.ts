import { create } from 'zustand';
import type { Seat, Booking, WaitingItem, Bill, TimeRate, SeatStatus } from '@/types';
import { seatList } from '@/data/seats';
import { bookings as bookingMock } from '@/data/bookings';
import { waitingList as waitingMock } from '@/data/waiting';
import { bills as billsMock } from '@/data/bills';
import { timeRates as ratesMock } from '@/data/rates';
import { calculateBillingSegments, calculateTotalAmount } from '@/utils/billing';

const nowStr = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

const ACTIVE_BOOKING_STATUS = new Set(['reserved', 'checkedin', 'away']);

function isTimeOverlap(
  bStart: string, bEnd: string,
  qStart: string, qEnd: string
): boolean {
  const bs = new Date(bStart.replace(' ', 'T')).getTime();
  const be = new Date(bEnd.replace(' ', 'T')).getTime();
  const qs = new Date(qStart.replace(' ', 'T')).getTime();
  const qe = new Date(qEnd.replace(' ', 'T')).getTime();
  return qs < be && qe > bs;
}

export function computeSeatStatus(
  seat: Seat,
  bookings: Booking[],
  queryDate: string,
  queryStart: string,
  queryEnd: string
): SeatStatus {
  if (!seat.enabled) return 'disabled';
  const qStart = `${queryDate} ${queryStart}`;
  const qEnd = `${queryDate} ${queryEnd}`;
  const hasOverlap = bookings.some(
    (b) =>
      b.seatId === seat.id &&
      ACTIVE_BOOKING_STATUS.has(b.status) &&
      isTimeOverlap(b.startTime, b.endTime, qStart, qEnd)
  );
  return hasOverlap ? 'occupied' : 'free';
}

function isSeatFreeAt(
  seatId: string,
  seats: Seat[],
  bookings: Booking[],
  startDate: string,
  startTime: string,
  endTime: string
): boolean {
  const seat = seats.find((s) => s.id === seatId);
  if (!seat || !seat.enabled) return false;
  return computeSeatStatus(seat, bookings, startDate, startTime, endTime) === 'free';
}

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
  payBill: (billId: string) => void;
  addWaiting: (seatId?: string) => WaitingItem | null;
  cancelWaiting: (id: string) => void;
  confirmWaiting: (id: string) => Booking | null;
  releaseTimeoutSeats: () => string[];
  releaseAwayTimeout: () => string[];
  expireNotifiedWaiting: () => void;
  addSeat: (seat: Omit<Seat, 'id'>) => void;
  updateSeat: (id: string, data: Partial<Seat>) => void;
  toggleSeatEnabled: (id: string) => void;
  addRate: (rate: Omit<TimeRate, 'id'>) => void;
  updateRate: (id: string, data: Partial<TimeRate>) => void;
  toggleRateEnabled: (id: string) => void;
  startGlobalTimer: () => void;
}

let globalTimer: ReturnType<typeof setInterval> | null = null;

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
  setSelectedDate: (d) => set({ selectedDate: d, selectedSeatId: null }),
  setStartTime: (t) => set({ startTime: t }),
  setEndTime: (t) => set({ endTime: t }),

  toggleSeatSelection: (id) => {
    const { seats, selectedSeatId, bookings, selectedDate, startTime, endTime } = get();
    const seat = seats.find((s) => s.id === id);
    if (!seat || !seat.enabled) return;
    const status = computeSeatStatus(seat, bookings, selectedDate, startTime, endTime);
    if (status === 'occupied' || status === 'disabled') return;
    set({ selectedSeatId: selectedSeatId === id ? null : id });
  },

  bookSeat: () => {
    const { selectedSeatId, seats, selectedDate, startTime, endTime, rates, bookings } = get();
    if (!selectedSeatId) return null;
    const seat = seats.find((s) => s.id === selectedSeatId);
    if (!seat || !seat.enabled) return null;
    const status = computeSeatStatus(seat, bookings, selectedDate, startTime, endTime);
    if (status !== 'free') return null;

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
      bills: [...state.bills, newBill],
      selectedSeatId: null
    }));

    console.log('[Booking] 预订成功+账单已生成:', newBooking.id, '金额:', totalAmount);
    return newBooking;
  },

  cancelBooking: (id) => {
    let seatId: string | null = null;
    set((state) => {
      const booking = state.bookings.find((b) => b.id === id);
      if (!booking) return state;
      seatId = booking.seatId;
      return {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: 'cancelled' as const } : b
        ),
        bills: state.bills.map((bl) =>
          bl.bookingId === id && bl.status === 'pending'
            ? { ...bl, status: 'refunded' as const, refundSource: 'cancel' as const }
            : bl
        )
      };
    });
    if (seatId) {
      tryAutoNotify(seatId, get);
      reorderWaitingQueue(seatId, get, set);
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
    let seatId: string | null = null;
    set((state) => {
      const booking = state.bookings.find((b) => b.id === id);
      if (!booking) return state;
      seatId = booking.seatId;
      return {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status: 'completed' as const, checkoutTime: nowStr() } : b
        ),
        bills: state.bills.map((bl) =>
          bl.bookingId === id ? { ...bl, status: 'paid' as const, paidAt: nowStr() } : bl
        )
      };
    });
    if (seatId) {
      tryAutoNotify(seatId, get);
    }
    console.log('[Booking] 离座结算:', id);
  },

  payBill: (billId) => {
    set((state) => ({
      bills: state.bills.map((bl) =>
        bl.id === billId && bl.status === 'pending'
          ? { ...bl, status: 'paid' as const, paidAt: nowStr() }
          : bl
      )
    }));
    console.log('[Bill] 支付成功:', billId);
  },

  addWaiting: (seatId) => {
    const { waitingList, selectedDate, startTime, endTime } = get();
    const activeList = waitingList.filter(
      (w) => w.status === 'waiting' || w.status === 'notified'
    );
    const queueList = seatId
      ? activeList.filter((w) => w.seatId === seatId)
      : activeList.filter((w) => !w.seatId);
    const position = queueList.length + 1;

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
    console.log('[Waiting] 候补登记:', item.id, '排位#', position);
    return item;
  },

  cancelWaiting: (id) => {
    let seatId: string | undefined;
    set((state) => {
      const item = state.waitingList.find((w) => w.id === id);
      if (!item) return state;
      seatId = item.seatId;
      return {
        waitingList: state.waitingList.map((w) =>
          w.id === id ? { ...w, status: 'cancelled' as const } : w
        )
      };
    });
    reorderWaitingQueue(seatId ?? null, get, set);
    console.log('[Waiting] 取消候补:', id);
  },

  confirmWaiting: (id) => {
    const { seats, rates, waitingList, bookings, selectedDate } = get();
    const item = waitingList.find((w) => w.id === id);
    if (!item || item.status !== 'notified') return null;

    const targetSeatId = item.seatId;
    if (!targetSeatId) return null;

    const seat = seats.find((s) => s.id === targetSeatId);
    if (!seat || !seat.enabled) {
      console.log('[Waiting] 补位失败：座位停用', targetSeatId);
      return null;
    }

    const itemDate = item.startTime.slice(0, 10);
    const itemStart = item.startTime.slice(11, 16);
    const itemEnd = item.endTime.slice(11, 16);
    if (!isSeatFreeAt(targetSeatId, seats, bookings, itemDate, itemStart, itemEnd)) {
      console.log('[Waiting] 补位失败：座位该时段已被占用', targetSeatId);
      return null;
    }

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
      bills: [...state.bills, newBill]
    }));

    reorderWaitingQueue(item.seatId ?? null, get, set);
    console.log('[Waiting] 补位确认成功:', item.id, '→ 预约:', newBooking.id);
    return newBooking;
  },

  releaseTimeoutSeats: () => {
    const now = Date.now();
    const released: string[] = [];
    const releasedBillIds: string[] = [];

    set((state) => {
      const updatedBookings = state.bookings.map((b) => {
        if (b.status === 'reserved') {
          const startMs = new Date(b.startTime.replace(' ', 'T')).getTime();
          const deadlineMs = startMs + b.timeoutMinutes * 60 * 1000;
          if (now > deadlineMs) {
            released.push(b.seatId);
            releasedBillIds.push(b.id);
            return { ...b, status: 'timeout' as const };
          }
        }
        return b;
      });

      const updatedBills = state.bills.map((bl) =>
        releasedBillIds.includes(bl.bookingId) && bl.status === 'pending'
          ? { ...bl, status: 'refunded' as const, refundSource: 'timeout' as const }
          : bl
      );

      return { bookings: updatedBookings, bills: updatedBills };
    });

    released.forEach((seatId) => {
      tryAutoNotify(seatId, get);
      reorderWaitingQueue(seatId, get, set);
    });

    if (released.length > 0) {
      console.log('[Timeout] 签到超时释放:', released);
    }
    return released;
  },

  releaseAwayTimeout: () => {
    const now = Date.now();
    const released: string[] = [];
    const releasedBookingIds: string[] = [];

    set((state) => {
      const updatedBookings = state.bookings.map((b) => {
        if (b.status === 'away' && b.awayAt) {
          const awayMs = new Date(b.awayAt.replace(' ', 'T')).getTime();
          if (now - awayMs > b.awayTimeoutMinutes * 60 * 1000) {
            released.push(b.seatId);
            releasedBookingIds.push(b.id);
            return { ...b, status: 'timeout' as const, checkoutTime: nowStr() };
          }
        }
        return b;
      });

      const updatedBills = state.bills.map((bl) =>
        releasedBookingIds.includes(bl.bookingId) && bl.status === 'pending'
          ? { ...bl, status: 'refunded' as const, refundSource: 'away_timeout' as const }
          : bl
      );

      return { bookings: updatedBookings, bills: updatedBills };
    });

    released.forEach((seatId) => {
      tryAutoNotify(seatId, get);
      reorderWaitingQueue(seatId, get, set);
    });

    if (released.length > 0) {
      console.log('[Timeout] 暂离超时释放:', released);
    }
    return released;
  },

  expireNotifiedWaiting: () => {
    const now = Date.now();
    const NOTIFY_TIMEOUT_MS = 10 * 60 * 1000;
    const expiredSeatIds: string[] = [];

    set((state) => {
      const updated = state.waitingList.map((w) => {
        if (w.status === 'notified' && w.notifiedAt) {
          const notifiedMs = new Date(w.notifiedAt.replace(' ', 'T')).getTime();
          if (now - notifiedMs > NOTIFY_TIMEOUT_MS) {
            expiredSeatIds.push(w.seatId || '');
            return { ...w, status: 'expired' as const };
          }
        }
        return w;
      });
      return { waitingList: updated };
    });

    const uniqueSeatIds = [...new Set(expiredSeatIds)].filter(Boolean);
    uniqueSeatIds.forEach((seatId) => {
      tryAutoNotify(seatId, get);
      reorderWaitingQueue(seatId, get, set);
    });

    if (uniqueSeatIds.length > 0) {
      console.log('[Waiting] 通知超时过期，转下一位:', uniqueSeatIds);
    }
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
            ? { ...s, enabled: newEnabled, status: newEnabled ? 'free' as const : 'disabled' as const }
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
  },

  startGlobalTimer: () => {
    if (globalTimer) return;
    globalTimer = setInterval(() => {
      get().releaseTimeoutSeats();
      get().releaseAwayTimeout();
      get().expireNotifiedWaiting();
    }, 60000);
    console.log('[Store] 全局定时检查已启动');
  }
}));

function tryAutoNotify(seatId: string, get: () => StudyRoomStore) {
  const { waitingList } = get();
  const candidates = waitingList
    .filter((w) => w.status === 'waiting' && (!w.seatId || w.seatId === seatId))
    .sort((a, b) => a.queuePosition - b.queuePosition);
  if (candidates.length === 0) return;

  const next = candidates[0];
  useStudyRoomStore.setState((state) => ({
    waitingList: state.waitingList.map((w) =>
      w.id === next.id
        ? { ...w, status: 'notified' as const, notifiedAt: nowStr() }
        : w
    )
  }));
  console.log('[AutoNotify] 座位释放，通知候补:', next.userName, '#', next.queuePosition);
}

function reorderWaitingQueue(seatId: string | null, get: () => StudyRoomStore, _set: any) {
  const { waitingList } = get();
  const active = waitingList.filter(w => w.status === 'waiting' || w.status === 'notified');
  const seatQueue = seatId ? active.filter(w => w.seatId === seatId) : [];
  const globalQueue = active.filter(w => !w.seatId);

  seatQueue.sort((a, b) => {
    if (a.status === 'notified' && b.status !== 'notified') return -1;
    if (b.status === 'notified' && a.status !== 'notified') return 1;
    return a.queuePosition - b.queuePosition;
  });
  globalQueue.sort((a, b) => {
    if (a.status === 'notified' && b.status !== 'notified') return -1;
    if (b.status === 'notified' && a.status !== 'notified') return 1;
    return a.queuePosition - b.queuePosition;
  });

  const updates = new Map<string, number>();
  seatQueue.forEach((w, i) => updates.set(w.id, i + 1));
  globalQueue.forEach((w, i) => updates.set(w.id, i + 1));

  useStudyRoomStore.setState((state) => ({
    waitingList: state.waitingList.map((w) =>
      updates.has(w.id) ? { ...w, queuePosition: updates.get(w.id)! } : w
    )
  }));
}
