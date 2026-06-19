import React, { useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStudyRoomStore } from '@/store';
import { formatTime } from '@/utils/time';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { bills, bookings, cancelBooking, checkin, markAway, markBack, checkout } = useStudyRoomStore();

  const stats = useMemo(() => {
    const paid = bills.filter((b) => b.status === 'paid');
    const totalHours = paid.reduce((s, b) => s + b.totalMinutes, 0) / 60;
    const currentBooking = bookings.find((b) =>
      b.status === 'reserved' || b.status === 'checkedin' || b.status === 'away'
    );
    return {
      orderCount: paid.length,
      totalHours: totalHours.toFixed(1),
      totalSpent: paid.reduce((s, b) => s + b.totalAmount, 0).toFixed(2),
      currentBooking
    };
  }, [bills, bookings]);

  const menus = [
    { icon: '📋', label: '时段费率表', page: 'rate' },
    { icon: '🪑', label: '座位管理', page: 'seat-admin' },
    { icon: '📊', label: '我的预约', page: 'booking' },
    { icon: '🔔', label: '消息通知', page: '' },
    { icon: '⚙️', label: '系统设置', page: '' }
  ];

  const handleMenuClick = (page: string) => {
    if (!page) {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    Taro.navigateTo({ url: `/pages/${page}/index` });
  };

  const handleCancelBooking = () => {
    if (!stats.currentBooking) return;
    Taro.showModal({
      title: '取消预约',
      content: '确认取消当前座位预约？',
      success: (res) => {
        if (res.confirm && stats.currentBooking) {
          cancelBooking(stats.currentBooking.id);
          Taro.showToast({ title: '已取消预约', icon: 'none' });
        }
      }
    });
  };

  const handleCheckin = () => {
    if (!stats.currentBooking) return;
    checkin(stats.currentBooking.id);
    Taro.showToast({ title: '签到成功！欢迎使用', icon: 'success' });
  };

  const handleMarkAway = () => {
    if (!stats.currentBooking) return;
    markAway(stats.currentBooking.id);
    Taro.showToast({ title: '已标记暂离，30分钟内请返回', icon: 'none' });
  };

  const handleMarkBack = () => {
    if (!stats.currentBooking) return;
    markBack(stats.currentBooking.id);
    Taro.showToast({ title: '欢迎回来！', icon: 'success' });
  };

  const handleCheckout = () => {
    if (!stats.currentBooking) return;
    Taro.showModal({
      title: '确认离座',
      content: '离座后将释放座位并完成结算，确认离座？',
      success: (res) => {
        if (res.confirm && stats.currentBooking) {
          checkout(stats.currentBooking.id);
          Taro.showToast({ title: '已离座，费用已结算', icon: 'success' });
        }
      }
    });
  };

  const getStatusText = () => {
    if (!stats.currentBooking) return '';
    const s = stats.currentBooking.status;
    if (s === 'reserved') return '待签到';
    if (s === 'checkedin') return '使用中';
    if (s === 'away') return '暂离中';
    return '';
  };

  const getStatusBadge = () => {
    if (!stats.currentBooking) return '';
    const s = stats.currentBooking.status;
    if (s === 'away') return styles.badgeAway;
    if (s === 'checkedin') return styles.badgeActive;
    return styles.badgeReserved;
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userRow}>
          <View className={styles.avatar}>张</View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>张小满</Text>
            <Text className={styles.userDesc}>学习达人 · 已累计学习 {stats.totalHours} 小时</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{stats.orderCount}</Text>
          <Text className={styles.statLabel}>总订单</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{stats.totalHours}h</Text>
          <Text className={styles.statLabel}>学习时长</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>¥{stats.totalSpent}</Text>
          <Text className={styles.statLabel}>累计消费</Text>
        </View>
      </View>

      {stats.currentBooking && (
        <View className={styles.currentBooking}>
          <View className={styles.bookingTitle}>
            <Text>当前预约</Text>
            <Text className={`${styles.bookingBadge} ${getStatusBadge()}`}>
              {getStatusText()}
            </Text>
          </View>
          <View className={styles.bookingRow}>
            <Text>座位号</Text>
            <Text className={styles.bookingValue}>{stats.currentBooking.seatCode}</Text>
          </View>
          <View className={styles.bookingRow}>
            <Text>使用时段</Text>
            <Text className={styles.bookingValue}>
              {formatTime(stats.currentBooking.startTime)} - {formatTime(stats.currentBooking.endTime)}
            </Text>
          </View>
          {stats.currentBooking.status === 'reserved' && (
            <View className={styles.bookingRow}>
              <Text>签到时限</Text>
              <Text className={styles.bookingValue}>预约后 {stats.currentBooking.timeoutMinutes} 分钟内</Text>
            </View>
          )}
          {stats.currentBooking.status === 'away' && stats.currentBooking.awayAt && (
            <View className={styles.bookingRow}>
              <Text>暂离时限</Text>
              <Text className={styles.bookingValue}>{stats.currentBooking.awayTimeoutMinutes} 分钟内返回</Text>
            </View>
          )}

          <View className={styles.bookingBtns}>
            <Button className={`${styles.bookingBtn} ${styles.btnGhost}`} onClick={handleCancelBooking}>
              取消预约
            </Button>
            {stats.currentBooking.status === 'reserved' && (
              <Button className={`${styles.bookingBtn} ${styles.btnPrimary}`} onClick={handleCheckin}>
                立即签到
              </Button>
            )}
            {stats.currentBooking.status === 'checkedin' && (
              <>
                <Button className={`${styles.bookingBtn} ${styles.btnAway}`} onClick={handleMarkAway}>
                  暂离
                </Button>
                <Button className={`${styles.bookingBtn} ${styles.btnPrimary}`} onClick={handleCheckout}>
                  离座结算
                </Button>
              </>
            )}
            {stats.currentBooking.status === 'away' && (
              <>
                <Button className={`${styles.bookingBtn} ${styles.btnPrimary}`} onClick={handleMarkBack}>
                  已返回
                </Button>
                <Button className={`${styles.bookingBtn} ${styles.btnGhost}`} onClick={handleCheckout}>
                  离座结算
                </Button>
              </>
            )}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>常用功能</Text>
        <View className={styles.menuCard}>
          {menus.map((m) => (
            <View key={m.label} className={styles.menuItem} onClick={() => handleMenuClick(m.page)}>
              <View className={styles.menuIcon}>
                <Text>{m.icon}</Text>
              </View>
              <Text className={styles.menuLabel}>{m.label}</Text>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
