import dayjs from 'dayjs';
import type { Bill } from '@/types';
import { calculateBillingSegments, calculateTotalAmount } from '@/utils/billing';
import { timeRates } from './rates';

const buildBill = (
  id: string,
  seatCode: string,
  startH: number,
  startM: number,
  endH: number,
  endM: number,
  daysAgo = 0,
  status: Bill['status'] = 'paid'
): Bill => {
  const startTime = dayjs()
    .subtract(daysAgo, 'day')
    .hour(startH)
    .minute(startM)
    .format('YYYY-MM-DD HH:mm');
  const endTime = dayjs()
    .subtract(daysAgo, 'day')
    .hour(endH)
    .minute(endM)
    .format('YYYY-MM-DD HH:mm');
  const segments = calculateBillingSegments(startTime, endTime, timeRates);
  const totalMinutes = segments.reduce((sum, s) => sum + s.durationMinutes, 0);
  return {
    id,
    bookingId: `bk_${id}`,
    seatCode,
    userId: 'u_001',
    userName: '张小满',
    startTime,
    endTime,
    totalMinutes,
    segments,
    totalAmount: calculateTotalAmount(segments),
    status,
    createdAt: startTime,
    paidAt: status === 'paid' ? startTime : undefined
  };
};

export const bills: Bill[] = [
  buildBill('bill_001', 'A1-2', 9, 0, 11, 30, 0, 'pending'),
  buildBill('bill_002', 'B1-3', 13, 30, 17, 0, 1, 'paid'),
  buildBill('bill_003', 'C2-1', 10, 0, 15, 0, 2, 'paid'),
  buildBill('bill_004', 'A3-1', 18, 0, 21, 30, 3, 'paid'),
  buildBill('bill_005', 'B2-4', 8, 30, 12, 0, 5, 'paid'),
  buildBill('bill_006', 'A2-2', 14, 0, 19, 0, 7, 'paid')
];
