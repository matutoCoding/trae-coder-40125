import type { Seat } from '@/types';

const seatTypeNames: Record<string, string> = {
  standard: '标准座',
  window: '靠窗座',
  single: '单人间',
  sofa: '沙发座'
};

const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  const zones = ['A区', 'B区', 'C区'];
  const rowsPerZone = 3;
  const colsPerRow = 5;

  zones.forEach((zone, zoneIdx) => {
    for (let row = 1; row <= rowsPerZone; row++) {
      for (let col = 1; col <= colsPerRow; col++) {
        const seatRow = zoneIdx * rowsPerZone + row;
        const code = `${zone.charAt(0)}${row}-${col}`;
        let type: Seat['type'] = 'standard';
        if (col === 1 || col === colsPerRow) type = 'window';
        if (seatRow % 5 === 0 && col === 3) type = 'sofa';
        if (seatRow % 7 === 0) type = 'single';

        const occupiedSeats = ['A1-1', 'A1-2', 'A2-3', 'B1-4', 'B2-2', 'C1-3', 'C2-5'];
        const disabledSeats = ['A3-5'];

        let status: Seat['status'] = 'free';
        if (occupiedSeats.includes(code)) status = 'occupied';
        if (disabledSeats.includes(code)) status = 'disabled';

        seats.push({
          id: `seat_${code}`,
          code,
          row: seatRow,
          col,
          type,
          status,
          zone,
          enabled: !disabledSeats.includes(code)
        });
      }
    }
  });
  return seats;
};

export const seatList = generateSeats();

export const getSeatTypeName = (type: Seat['type']): string => seatTypeNames[type] || '标准座';
