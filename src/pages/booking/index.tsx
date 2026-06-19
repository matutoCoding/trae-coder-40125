import React, { useMemo, useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useStudyRoomStore } from '@/store';
import { formatTime } from '@/utils/time';
import { formatMinutes } from '@/utils/billing';
import styles from './index.module.scss';

const REFUND_SOURCE_MAP: Record<string, string> = {
  timeout: '签到超时释放',
  cancel: '预约取消',
  away_timeout: '暂离超时释放'
};

type FilterType = 'active' | 'reserved' | 'checkedin' | 'ended';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  reserved: { label: '待签到', cls: styles.tagReserved },
  checkedin: { label: '使用中', cls: styles.tagCheckedin },
  away: { label: '暂离中', cls: styles.tagAway },
  completed: { label: '已结束', cls: styles.tagCompleted },
  cancelled: { label: '已取消', cls: styles.tagCancelled },
  timeout: { label: '超时释放', cls: styles.tagTimeout }
};

const BookingPage: React.FC = () => {
  const { bookings, bills, cancelBooking, checkin, markAway, markBack, checkout, payBill, setHighlightBillId } = useStudyRoomStore();
  const [filter, setFilter] = useState<FilterType>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...bookings].sort(
      (a, b) => new Date(b.createdAt.replace(' ', 'T')).getTime() - new Date(a.createdAt.replace(' ', 'T')).getTime()
    );
    if (filter === 'active') return sorted.filter((b) => ['reserved', 'checkedin', 'away'].includes(b.status));
    if (filter === 'reserved') return sorted.filter((b) => b.status === 'reserved');
    if (filter === 'checkedin') return sorted.filter((b) => ['checkedin', 'away'].includes(b.status));
    return sorted.filter((b) => ['completed', 'cancelled', 'timeout'].includes(b.status));
  }, [bookings, filter]);

  const getBillForBooking = (bookingId: string) => bills.find((bl) => bl.bookingId === bookingId);

  const handleCancel = (id: string) => {
    Taro.showModal({
      title: '取消预约', content: '确认取消该预约？待支付账单将退款',
      success: (res) => { if (res.confirm) { cancelBooking(id); Taro.showToast({ title: '已取消', icon: 'none' }); } }
    });
  };

  const handleCheckin = (id: string) => { checkin(id); Taro.showToast({ title: '签到成功', icon: 'success' }); };
  const handleAway = (id: string) => { markAway(id); Taro.showToast({ title: '已标记暂离', icon: 'none' }); };
  const handleBack = (id: string) => { markBack(id); Taro.showToast({ title: '欢迎回来', icon: 'success' }); };
  const handleCheckout = (id: string) => {
    Taro.showModal({
      title: '确认离座', content: '离座后释放座位并完成结算',
      success: (res) => { if (res.confirm) { checkout(id); Taro.showToast({ title: '已离座结算', icon: 'success' }); } }
    });
  };

  const goBill = (bookingId: string) => {
    const bill = bills.find((bl) => bl.bookingId === bookingId);
    if (bill) {
      setHighlightBillId(bill.id);
    }
    Taro.switchTab({ url: '/pages/bill/index' });
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'active', label: '进行中' },
    { key: 'reserved', label: '待签到' },
    { key: 'checkedin', label: '使用中' },
    { key: 'ended', label: '已结束' }
  ];

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>📋 我的预约</Text>
        <Text className={styles.heroSub}>查看所有预约记录、座位与账单状态</Text>
      </View>

      <View className={styles.filterTabs}>
        {filters.map((f) => (
          <View key={f.key} className={classnames(styles.tab, filter === f.key && styles.tabActive)} onClick={() => setFilter(f.key)}>
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>�</Text>
          <Text className={styles.emptyText}>暂无预约记录</Text>
        </View>
      ) : (
        filtered.map((b) => {
          const bill = getBillForBooking(b.id);
          const st = STATUS_MAP[b.status] || { label: b.status, cls: '' };
          const isExpanded = expandedId === b.id;
          const isActive = ['reserved', 'checkedin', 'away'].includes(b.status);

          return (
            <View key={b.id} className={styles.card}>
              <View className={styles.cardHeader} onClick={() => setExpandedId(isExpanded ? null : b.id)}>
                <View className={styles.cardLeft}>
                  <Text className={styles.seatCode}>座位 {b.seatCode}</Text>
                  <Text className={styles.cardTime}>
                    {dayjs(b.startTime).format('MM-DD')} {formatTime(b.startTime)} - {formatTime(b.endTime)}
                  </Text>
                </View>
                <View className={styles.cardRight}>
                  <Text className={classnames(styles.tag, st.cls)}>{st.label}</Text>
                  <Text className={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
              </View>

              {isExpanded && (
                <View className={styles.detail}>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>预约编号</Text>
                    <Text className={styles.detailValue}>{b.id}</Text>
                  </View>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>使用时段</Text>
                    <Text className={styles.detailValue}>{formatTime(b.startTime)} - {formatTime(b.endTime)}</Text>
                  </View>
                  {b.status === 'reserved' && (
                    <View className={styles.detailRow}>
                      <Text className={styles.detailLabel}>签到时限</Text>
                      <Text className={styles.detailValue}>
                        {dayjs(b.startTime).add(b.timeoutMinutes, 'minute').format('HH:mm')} 前未签到将自动释放
                      </Text>
                    </View>
                  )}
                  {bill && (
                    <>
                      <View className={styles.detailRow}>
                        <Text className={styles.detailLabel}>账单金额</Text>
                        <Text className={styles.detailValue}>¥{bill.totalAmount.toFixed(2)}</Text>
                      </View>
                      <View className={styles.detailRow}>
                        <Text className={styles.detailLabel}>账单状态</Text>
                        <Text className={classnames(
                          styles.detailValue,
                          bill.status === 'paid' && styles.billPaid,
                          bill.status === 'pending' && styles.billPending,
                          bill.status === 'refunded' && styles.billRefunded
                        )}>
                          {bill.status === 'paid' ? '已支付' : bill.status === 'pending' ? '待支付' : '已退款'}
                        </Text>
                      </View>
                      {bill.status === 'refunded' && bill.refundSource && (
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>退款来源</Text>
                          <Text className={styles.detailValue}>{REFUND_SOURCE_MAP[bill.refundSource] || bill.refundSource}</Text>
                        </View>
                      )}
                      {bill.status === 'paid' && bill.paidAt && (
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>支付时间</Text>
                          <Text className={styles.detailValue}>{dayjs(bill.paidAt).format('YYYY-MM-DD HH:mm')}</Text>
                        </View>
                      )}
                      {bill.segments.length > 0 && (
                        <View className={styles.segSection}>
                          {bill.segments.map((seg, idx) => (
                            <View key={idx} className={styles.segRow}>
                              <Text className={styles.segLabel}>
                                {seg.rateName} {formatTime(seg.startTime)}-{formatTime(seg.endTime)} {seg.durationMinutes}分
                              </Text>
                              <Text className={styles.segAmount}>¥{seg.subtotal.toFixed(2)}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {bill.status === 'pending' && (
                        <Button className={styles.payBillBtn} onClick={() => {
                          payBill(bill.id);
                          Taro.showToast({ title: '支付成功', icon: 'success' });
                        }}>
                          立即支付 ¥{bill.totalAmount.toFixed(2)}
                        </Button>
                      )}
                      <Button className={styles.goBillBtn} onClick={() => goBill(b.id)}>查看账单详情 ›</Button>
                    </>
                  )}
                  {b.status === 'timeout' && bill?.status === 'refunded' && (
                    <View className={styles.refundHint}>
                      ⚠️ 该预约因{bill.refundSource === 'away_timeout' ? '暂离超时' : '签到超时'}已自动释放，账单已退款（来源：{REFUND_SOURCE_MAP[bill.refundSource || ''] || '超时释放'}）
                    </View>
                  )}
                  {b.status === 'cancelled' && bill?.status === 'refunded' && (
                    <View className={styles.refundHint}>
                      ⚠️ 该预约已取消，账单已退款
                    </View>
                  )}

                  {isActive && (
                    <View className={styles.actionBtns}>
                      <Button className={styles.actionBtnGhost} onClick={() => handleCancel(b.id)}>取消预约</Button>
                      {b.status === 'reserved' && (
                        <Button className={styles.actionBtnPrimary} onClick={() => handleCheckin(b.id)}>立即签到</Button>
                      )}
                      {b.status === 'checkedin' && (
                        <>
                          <Button className={styles.actionBtnAway} onClick={() => handleAway(b.id)}>暂离</Button>
                          <Button className={styles.actionBtnPrimary} onClick={() => handleCheckout(b.id)}>离座结算</Button>
                        </>
                      )}
                      {b.status === 'away' && (
                        <>
                          <Button className={styles.actionBtnPrimary} onClick={() => handleBack(b.id)}>已返回</Button>
                          <Button className={styles.actionBtnGhost} onClick={() => handleCheckout(b.id)}>离座结算</Button>
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

export default BookingPage;
