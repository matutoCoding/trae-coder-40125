import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import type { WaitingItem } from '@/types';
import { formatTime } from '@/utils/time';
import styles from './index.module.scss';

interface WaitingCardProps {
  item: WaitingItem;
  onCancel?: (id: string) => void;
  onConfirm?: (id: string) => void;
}

const WaitingCard: React.FC<WaitingCardProps> = ({ item, onCancel, onConfirm }) => {
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

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View className={styles.position}>
          <View className={styles.positionBadge}>#{item.queuePosition}</View>
          <Text className={styles.positionText}>
            {item.seatId ? '指定座位候补' : '全局候补队列'}
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

      {item.seatId && (
        <View className={styles.infoRow}>
          <Text>目标座位</Text>
          <Text className={styles.infoHighlight}>{item.seatId.replace('seat_', '')}</Text>
        </View>
      )}

      {item.status === 'notified' && item.notifiedAt && (
        <View className={styles.notifiedHint}>
          🎉 有空位啦！请于10分钟内确认，超时将自动释放给下一位
        </View>
      )}

      {item.status === 'confirmed' && (
        <View className={styles.confirmedHint}>
          ✅ 已成功补位，座位已为您锁定
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
