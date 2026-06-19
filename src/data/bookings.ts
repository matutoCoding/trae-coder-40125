import dayjs from 'dayjs';
import type { Booking } from '@/types';

export const bookings: Booking[] = [
  {
    id: 'bk_001',
    seatId: 'seat_A1-1',
    seatCode: 'A1-1',
    userId: 'u_001',
    userName: '张小满',
    startTime: dayjs().hour(9).minute(0).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs().hour(11).minute(30).format('YYYY-MM-DD HH:mm'),
    status: 'checkedin',
    createdAt: dayjs().hour(8).minute(30).format('YYYY-MM-DD HH:mm'),
    checkinTime: dayjs().hour(8).minute(55).format('YYYY-MM-DD HH:mm'),
    timeoutMinutes: 15
  },
  {
    id: 'bk_002',
    seatId: 'seat_A1-2',
    seatCode: 'A1-2',
    userId: 'u_002',
    userName: '李学习',
    startTime: dayjs().hour(10).minute(0).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs().hour(14).minute(0).format('YYYY-MM-DD HH:mm'),
    status: 'reserved',
    createdAt: dayjs().hour(9).minute(50).format('YYYY-MM-DD HH:mm'),
    timeoutMinutes: 15
  },
  {
    id: 'bk_003',
    seatId: 'seat_B2-2',
    seatCode: 'B2-2',
    userId: 'u_003',
    userName: '王考研',
    startTime: dayjs().hour(14).minute(0).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs().hour(20).minute(0).format('YYYY-MM-DD HH:mm'),
    status: 'reserved',
    createdAt: dayjs().hour(13).minute(40).format('YYYY-MM-DD HH:mm'),
    timeoutMinutes: 15
  },
  {
    id: 'bk_004',
    seatId: 'seat_C1-3',
    seatCode: 'C1-3',
    userId: 'u_004',
    userName: '陈备考',
    startTime: dayjs().hour(18).minute(0).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs().hour(22).minute(0).format('YYYY-MM-DD HH:mm'),
    status: 'reserved',
    createdAt: dayjs().hour(17).minute(30).format('YYYY-MM-DD HH:mm'),
    timeoutMinutes: 15
  }
];
