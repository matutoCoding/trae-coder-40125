import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import type { Bill, RateType } from '@/types';
import { formatDate, formatTime } from '@/utils/time';
import { formatMinutes, getRateTypeLabel } from '@/utils/billing';
import styles from './index.module.scss';

interface BillCardProps {
  bill: Bill;
  showDetail?: boolean;
  onPay?: (billId: string) => void;
}

const REFUND_SOURCE_MAP: Record<string, string> = {
  timeout: '签到超时释放',
  cancel: '预约取消',
  away_timeout: '暂离超时释放'
};

const getTagClass = (type: RateType) => {
  if (type === 'peak') return styles.tagPeak;
  if (type === 'offpeak') return styles.tagOffpeak;
  return styles.tagNormal;
};

const BillCard: React.FC<BillCardProps> = ({ bill, showDetail = true, onPay }) => {
  const statusClass =
    bill.status === 'paid'
      ? styles.statusPaid
      : bill.status === 'pending'
      ? styles.statusPending
      : styles.statusRefunded;

  const statusText =
    bill.status === 'paid' ? '已支付' : bill.status === 'pending' ? '待支付' : '已退款';

  const handlePay = () => {
    onPay?.(bill.id);
  };

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

      {bill.status === 'pending' && onPay && (
        <Button className={styles.payBtn} onClick={handlePay}>
          立即支付 ¥{bill.totalAmount.toFixed(2)}
        </Button>
      )}

      {bill.status === 'refunded' && bill.refundSource && (
        <View className={styles.refundRow}>
          <Text className={styles.refundLabel}>退款来源</Text>
          <Text className={styles.refundValue}>{REFUND_SOURCE_MAP[bill.refundSource] || bill.refundSource}</Text>
        </View>
      )}

      {bill.status === 'paid' && bill.paidAt && (
        <View className={styles.paidAtRow}>
          <Text className={styles.paidAtLabel}>支付时间</Text>
          <Text className={styles.paidAtValue}>{formatDate(bill.paidAt)} {formatTime(bill.paidAt)}</Text>
        </View>
      )}
    </View>
  );
};

export default BillCard;
