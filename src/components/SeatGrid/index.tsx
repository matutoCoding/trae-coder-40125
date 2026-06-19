import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { Seat } from '@/types';
import styles from './index.module.scss';

interface SeatGridProps {
  seats: Seat[];
  selectedSeatId: string | null;
  onSeatClick: (seatId: string) => void;
  zone?: string;
}

const SeatGrid: React.FC<SeatGridProps> = ({ seats, selectedSeatId, onSeatClick, zone }) => {
  const filteredSeats = useMemo(() => {
    return zone ? seats.filter((s) => s.zone === zone) : seats;
  }, [seats, zone]);

  const rows = useMemo(() => {
    const map = new Map<number, Seat[]>();
    filteredSeats.forEach((seat) => {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row)!.push(seat);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, list]) => list.sort((a, b) => a.col - b.col));
  }, [filteredSeats]);

  const displayZone = zone || filteredSeats[0]?.zone || '自习区';

  const getSeatClass = (seat: Seat) => {
    if (seat.status === 'disabled') return styles.disabled;
    if (seat.id === selectedSeatId) return styles.selected;
    if (seat.status === 'occupied') return styles.occupied;
    return styles.free;
  };

  return (
    <View className={styles.wrapper}>
      <Text className={styles.zoneTitle}>{displayZone}</Text>
      <View className={styles.screen}>前 方 讲 台 / 出 口</View>

      <View className={styles.grid}>
        {rows.map((rowSeats, ridx) => (
          <View key={ridx} className={styles.row}>
            {rowSeats.map((seat) => (
              <View
                key={seat.id}
                className={classnames(styles.seat, getSeatClass(seat))}
                onClick={() => seat.status !== 'disabled' && onSeatClick(seat.id)}
              >
                <Text>{seat.code.replace(/^[A-C]/, '').replace('-', '')}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot)} style={{ background: 'rgba(43,122,104,0.3)', border: '2rpx solid #2B7A68' }} />
          <Text>空闲</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: '#FFA940' }} />
          <Text>已选</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: '#86909C' }} />
          <Text>占用</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: '#F2F3F5', border: '2rpx dashed #C9CDD4' }} />
          <Text>维护</Text>
        </View>
      </View>
    </View>
  );
};

export default SeatGrid;
