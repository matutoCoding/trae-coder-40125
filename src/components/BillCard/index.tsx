import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { Bill, RateType } from '@/types';
import { formatDate, formatTime } from '@/utils/time';
import { formatMinutes, getRateTypeLabel } from '@/utils/billing';
import styles from './index.module.scss';

interface BillCardProps {
  bill: Bill;
  showDetail?: boolean;
}

const getTagClass = (type: RateType) => {
  if (type === 'peak') return styles.tagPeak;
  if (type === 'offpeak') return styles.tagOffpeak;
  return styles.tagNormal;
};

const BillCard: React.FC<BillCardProps> = ({ bill, showDetail = true }) => {
  const statusClass =
    bill.status === 'paid'
      ? styles.statusPaid
      : bill.status === 'pending'
      ? styles.statusPending
      : styles.statusRefunded;

  const statusText =
    bill.status === 'paid' ? '已支付' : bill.status === 'pending' ? '待支付' : '已退款';

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.seatCode}>座位 {bill.seatCode}</Text>
        <Text className={classnames(styles.status, statusClass)}>{statusText}</Text>
      </View>

      <View className={styles.timeRow}>
        <Text>{formatDate(bill.startTime)}</Text>
        <Text>
          {formatTime(bill.startTime)} - {formatTime(bill.endTime)}
        </Text>
        <Text>{formatMinutes(bill.totalMinutes)}</Text>
      </View>

      {showDetail && bill.segments.length > 0 && (
        <View className={styles.segments}>
          {bill.segments.map((seg, idx) => (
            <View key={idx} className={styles.segment}>
              <View className={styles.segLeft}>
                <View className={classnames(styles.segTag, getTagClass(seg.rateType))}>
                  {getRateTypeLabel(seg.rateType)}
                </View>
                <Text className={styles.segTime}>
                  {formatTime(seg.startTime)} - {formatTime(seg.endTime)} · {seg.durationMinutes}分 · ¥{seg.unitPrice}/时
                </Text>
              </View>
              <Text className={styles.segSub}>¥{seg.subtotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.amountRow}>
        <Text className={styles.amountLabel}>合计金额</Text>
        <Text className={styles.amountValue}>¥{bill.totalAmount.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default BillCard;
