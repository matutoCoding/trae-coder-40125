import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import type { WaitingItem, Seat } from '@/types';
import { formatTime } from '@/utils/time';
import styles from './index.module.scss';

interface WaitingCardProps {
  item: WaitingItem;
  seats?: Seat[];
  onCancel?: (id: string) => void;
  onConfirm?: (id: string) => void;
}

const WaitingCard: React.FC<WaitingCardProps> = ({ item, seats, onCancel, onConfirm }) => {
  const statusClass =
    item.status === 'waiting'
      ? styles.statusWaiting
      : item.status === 'notified'
      ? styles.statusNotified
      : item.status === 'confirmed'
      ? styles.statusConfirmed
      : styles.statusCancelled;

  const statusText =
    item.status === 'waiting'
      ? '排队中'
      : item.status === 'notified'
      ? '待确认补位'
      : item.status === 'confirmed'
      ? '已补位'
      : item.status === 'cancelled'
      ? '已取消'
      : '已过期';

  const isActive = item.status === 'waiting' || item.status === 'notified';

  const seatCode = item.seatId && seats
    ? (seats.find((s) => s.id === item.seatId)?.code || item.seatId.replace('seat_', ''))
    : item.seatId
    ? item.seatId.replace('seat_', '')
    : null;

  const isGlobalNotified = item.status === 'notified' && item.seatId;

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View className={styles.position}>
          <View className={styles.positionBadge}>#{item.queuePosition}</View>
          <Text className={styles.positionText}>
            {isGlobalNotified ? '全局候补（已分配座位）' : item.seatId ? '指定座位候补' : '全局候补队列'}
          </Text>
        </View>
        <Text className={classnames(styles.status, statusClass)}>{statusText}</Text>
      </View>

      <View className={styles.infoRow}>
        <Text>时段</Text>
        <Text className={styles.infoHighlight}>
          {formatTime(item.startTime)} - {formatTime(item.endTime)}
        </Text>
      </View>

      <View className={styles.infoRow}>
        <Text>候补人</Text>
        <Text className={styles.infoHighlight}>{item.userName}</Text>
      </View>

      {seatCode && (
        <View className={styles.infoRow}>
          <Text>{item.status === 'notified' || item.status === 'confirmed' ? '分配座位' : '目标座位'}</Text>
          <Text className={styles.infoHighlight}>{seatCode}</Text>
        </View>
      )}

      {item.status === 'notified' && item.notifiedAt && (
        <View className={styles.notifiedHint}>
          🎉 有空位啦！座位 {seatCode} 已为您保留，请于10分钟内确认，超时将自动释放给下一位
        </View>
      )}

      {item.status === 'confirmed' && (
        <View className={styles.confirmedHint}>
          ✅ 已成功补位到座位 {seatCode || ''}，座位已为您锁定
        </View>
      )}

      {isActive && (
        <View className={styles.footer}>
          {item.status === 'notified' && (
            <Button
              className={classnames(styles.btn, styles.btnWarn)}
              onClick={() => onConfirm?.(item.id)}
            >
              立即确认补位
            </Button>
          )}
          <Button
            className={classnames(styles.btn, item.status === 'notified' ? styles.btnGhost : styles.btnPrimary)}
            onClick={() => onCancel?.(item.id)}
          >
            取消候补
          </Button>
        </View>
      )}
    </View>
  );
};

export default WaitingCard;
