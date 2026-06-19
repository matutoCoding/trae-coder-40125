import dayjs from 'dayjs';
import type { TimeRate, BillingSegment, RateType } from '@/types';

const MINUTES_PER_HOUR = 60;

export const parseTimeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTimeStr = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const findRateForMinute = (minute: number, rates: TimeRate[]): TimeRate | null => {
  for (const rate of rates) {
    const start = parseTimeToMinutes(rate.startTime);
    const end = parseTimeToMinutes(rate.endTime);
    if (start < end) {
      if (minute >= start && minute < end) return rate;
    } else {
      if (minute >= start || minute < end) return rate;
    }
  }
  return null;
};

export const buildRateChangePoints = (rates: TimeRate[]): number[] => {
  const points = new Set<number>();
  rates.forEach((r) => {
    points.add(parseTimeToMinutes(r.startTime));
    points.add(parseTimeToMinutes(r.endTime));
  });
  points.add(0);
  points.add(24 * 60);
  return Array.from(points).sort((a, b) => a - b);
};

export const calculateBillingSegments = (
  startTime: string,
  endTime: string,
  rates: TimeRate[]
): BillingSegment[] => {
  const segments: BillingSegment[] = [];
  const startDayjs = dayjs(startTime);
  const endDayjs = dayjs(endTime);

  if (!startDayjs.isValid() || !endDayjs.isValid() || endDayjs.isBefore(startDayjs)) {
    return segments;
  }

  const rateChangePoints = buildRateChangePoints(rates);

  let cursor = startDayjs;

  while (cursor.isBefore(endDayjs)) {
    const cursorMinutes = cursor.hour() * 60 + cursor.minute();
    const currentRate = findRateForMinute(cursorMinutes, rates);

    let nextChangeMinute = 24 * 60;
    for (const p of rateChangePoints) {
      if (p > cursorMinutes) {
        nextChangeMinute = p;
        break;
      }
    }

    const nextChangeTime = cursor
      .hour(Math.floor(nextChangeMinute / 60))
      .minute(nextChangeMinute % 60)
      .second(0)
      .millisecond(0);

    const segmentEnd = nextChangeTime.isAfter(endDayjs) ? endDayjs : nextChangeTime;
    const durationMinutes = Math.round(segmentEnd.diff(cursor, 'minute', true));

    if (durationMinutes > 0 && currentRate) {
      const subtotal = Number(
        ((durationMinutes / MINUTES_PER_HOUR) * currentRate.pricePerHour).toFixed(2)
      );
      segments.push({
        startTime: cursor.format('YYYY-MM-DD HH:mm'),
        endTime: segmentEnd.format('YYYY-MM-DD HH:mm'),
        durationMinutes,
        rateType: currentRate.type,
        rateName: currentRate.name,
        unitPrice: currentRate.pricePerHour,
        subtotal
      });
    }

    cursor = segmentEnd;
  }

  return segments;
};

export const calculateTotalAmount = (segments: BillingSegment[]): number => {
  return Number(segments.reduce((sum, s) => sum + s.subtotal, 0).toFixed(2));
};

export const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}小时${m}分钟`;
  if (h > 0) return `${h}小时`;
  return `${m}分钟`;
};

export const getRateTypeLabel = (type: RateType): string => {
  const map: Record<RateType, string> = {
    peak: '高峰',
    offpeak: '平峰',
    normal: '标准'
  };
  return map[type];
};
