import dayjs from 'dayjs';

export const formatDateTime = (date: string | Date, fmt = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(fmt);
};

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm');
};

export const generateTimeSlots = (
  startHour = 8,
  endHour = 23,
  stepMinutes = 30
): { label: string; value: string }[] => {
  const slots: { label: string; value: string }[] = [];
  let minutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (minutes <= endMinutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    slots.push({ label: value, value });
    minutes += stepMinutes;
  }
  return slots;
};

export const getTodayStr = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const combineDateAndTime = (dateStr: string, timeStr: string): string => {
  return `${dateStr} ${timeStr}`;
};

export const diffMinutes = (start: string, end: string): number => {
  return dayjs(end).diff(dayjs(start), 'minute');
};

export const isTimeout = (reservedAt: string, timeoutMinutes: number): boolean => {
  return dayjs().diff(dayjs(reservedAt), 'minute') > timeoutMinutes;
};
