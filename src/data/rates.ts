import type { TimeRate } from '@/types';

export const timeRates: TimeRate[] = [
  {
    id: 'rate_1',
    name: '早间平峰',
    type: 'offpeak',
    startTime: '08:00',
    endTime: '12:00',
    pricePerHour: 4,
    dayOfWeek: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    id: 'rate_2',
    name: '午间高峰',
    type: 'peak',
    startTime: '12:00',
    endTime: '14:00',
    pricePerHour: 8,
    dayOfWeek: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    id: 'rate_3',
    name: '下午平峰',
    type: 'offpeak',
    startTime: '14:00',
    endTime: '18:00',
    pricePerHour: 5,
    dayOfWeek: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    id: 'rate_4',
    name: '晚间高峰',
    type: 'peak',
    startTime: '18:00',
    endTime: '22:00',
    pricePerHour: 10,
    dayOfWeek: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    id: 'rate_5',
    name: '夜间特惠',
    type: 'offpeak',
    startTime: '22:00',
    endTime: '23:00',
    pricePerHour: 3,
    dayOfWeek: [1, 2, 3, 4, 5, 6, 7]
  }
];
