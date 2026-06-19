import dayjs from 'dayjs';
import type { WaitingItem } from '@/types';

export const waitingList: WaitingItem[] = [
  {
    id: 'w_001',
    seatId: 'seat_A1-1',
    userId: 'u_010',
    userName: '赵同学',
    startTime: dayjs().hour(12).minute(0).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs().hour(15).minute(0).format('YYYY-MM-DD HH:mm'),
    queuePosition: 1,
    status: 'waiting',
    createdAt: dayjs().hour(10).minute(15).format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'w_002',
    userId: 'u_011',
    userName: '钱备考',
    startTime: dayjs().hour(14).minute(0).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs().hour(18).minute(0).format('YYYY-MM-DD HH:mm'),
    queuePosition: 2,
    status: 'waiting',
    createdAt: dayjs().hour(11).minute(0).format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'w_003',
    seatId: 'seat_A2-3',
    userId: 'u_012',
    userName: '孙考研',
    startTime: dayjs().hour(19).minute(0).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs().hour(22).minute(0).format('YYYY-MM-DD HH:mm'),
    queuePosition: 1,
    status: 'notified',
    createdAt: dayjs().hour(15).minute(30).format('YYYY-MM-DD HH:mm'),
    notifiedAt: dayjs().hour(16).minute(10).format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'w_004',
    userId: 'u_013',
    userName: '周自习',
    startTime: dayjs().hour(18).minute(30).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs().hour(21).minute(0).format('YYYY-MM-DD HH:mm'),
    queuePosition: 3,
    status: 'waiting',
    createdAt: dayjs().hour(12).minute(40).format('YYYY-MM-DD HH:mm')
  }
];
