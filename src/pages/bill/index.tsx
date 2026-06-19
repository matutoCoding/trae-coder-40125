import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useStudyRoomStore } from '@/store';
import BillCard from '@/components/BillCard';
import { getRateTypeLabel } from '@/utils/billing';
import type { RateType } from '@/types';
import styles from './index.module.scss';

type TabType = 'bills' | 'rates';
type BillFilter = 'all' | 'pending' | 'paid' | 'refunded';

const BillPage: React.FC = () => {
  const { bills, rates, payBill } = useStudyRoomStore();
  const [tab, setTab] = useState<TabType>('bills');
  const [billFilter, setBillFilter] = useState<BillFilter>('all');

  const summary = useMemo(() => {
    const paid = bills.filter((b) => b.status === 'paid');
    const total = paid.reduce((s, b) => s + b.totalAmount, 0);
    const totalHours = paid.reduce((s, b) => s + b.totalMinutes, 0) / 60;
    return { total, count: paid.length, totalHours };
  }, [bills]);

  const enabledRates = useMemo(() => rates.filter((r) => r.enabled), [rates]);

  const filteredBills = useMemo(() => {
    if (billFilter === 'all') return bills;
    return bills.filter((b) => b.status === billFilter);
  }, [bills, billFilter]);

  const getTagClass = (type: RateType) =>
    type === 'peak' ? styles.tagPeak : styles.tagOffpeak;

  const handlePay = (billId: string) => {
    Taro.showModal({
      title: '确认支付',
      content: '确认支付该笔账单？',
      success: (res) => {
        if (res.confirm) {
          payBill(billId);
          Taro.showToast({ title: '支付成功', icon: 'success' });
        }
      }
    });
  };

  const billFilters: { key: BillFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待支付' },
    { key: 'paid', label: '已支付' },
    { key: 'refunded', label: '已退款' }
  ];

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>消费账单</Text>
        <Text className={styles.heroSub}>按时段费率分段计费，透明消费</Text>

        <View className={styles.totalRow}>
          <Text className={styles.totalLabel}>累计消费</Text>
          <View>
            <Text className={styles.totalValue}>¥{summary.total.toFixed(2)}</Text>
            <Text className={styles.totalUnit}></Text>
          </View>
        </View>

        <View className={styles.summary}>
          <View className={styles.summaryBox}>
            <Text className={styles.summaryNum}>{summary.count}</Text>
            <Text className={styles.summaryLabel}>订单数</Text>
          </View>
          <View className={styles.summaryBox}>
            <Text className={styles.summaryNum}>{summary.totalHours.toFixed(1)}h</Text>
            <Text className={styles.summaryLabel}>学习时长</Text>
          </View>
          <View className={styles.summaryBox}>
            <Text className={styles.summaryNum}>{bills.filter((b) => b.status === 'pending').length}</Text>
            <Text className={styles.summaryLabel}>待支付</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, tab === 'bills' && styles.tabActive)}
          onClick={() => setTab('bills')}
        >
          <Text>消费账单</Text>
        </View>
        <View
          className={classnames(styles.tab, tab === 'rates' && styles.tabActive)}
          onClick={() => setTab('rates')}
        >
          <Text>时段费率</Text>
        </View>
      </View>

      {tab === 'bills' && (
        <>
          <View className={styles.billFilter}>
            {billFilters.map((f) => (
              <View
                key={f.key}
                className={classnames(styles.billFilterTab, billFilter === f.key && styles.billFilterActive)}
                onClick={() => setBillFilter(f.key)}
              >
                <Text>{f.label}</Text>
              </View>
            ))}
          </View>

          {filteredBills.length === 0 ? (
            <View className={styles.empty}>
              <Text className={styles.emptyIcon}>💰</Text>
              <Text className={styles.emptyText}>暂无消费记录</Text>
            </View>
          ) : (
            filteredBills.map((b) => (
              <BillCard key={b.id} bill={b} showDetail onPay={handlePay} />
            ))
          )}
        </>
      )}

      {tab === 'rates' && (
        <View className={styles.rateCard}>
          <Text className={styles.rateTitle}>📊 时段费率表</Text>
          {enabledRates.map((r) => (
            <View key={r.id} className={styles.rateItem}>
              <View className={styles.rateLeft}>
                <View className={classnames(styles.rateTag, getTagClass(r.type))}>
                  {getRateTypeLabel(r.type)}
                </View>
                <Text className={styles.rateTime}>
                  {r.name} · {r.startTime} - {r.endTime}
                </Text>
              </View>
              <Text className={styles.ratePrice}>¥{r.pricePerHour}/小时</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default BillPage;
