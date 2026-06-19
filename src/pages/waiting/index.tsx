import React, { useMemo, useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useStudyRoomStore } from '@/store';
import WaitingCard from '@/components/WaitingCard';
import { formatTime } from '@/utils/time';
import styles from './index.module.scss';

type FilterType = 'all' | 'waiting' | 'notified' | 'confirmed' | 'history';

const WaitingPage: React.FC = () => {
  const {
    waitingList,
    selectedSeatId,
    startTime,
    endTime,
    seats,
    addWaiting,
    cancelWaiting,
    confirmWaiting,
    expireNotifiedWaiting
  } = useStudyRoomStore();

  const [filter, setFilter] = useState<FilterType>('all');

  useDidShow(() => {
    expireNotifiedWaiting();
  });

  const stats = useMemo(() => {
    const waiting = waitingList.filter((w) => w.status === 'waiting').length;
    const notified = waitingList.filter((w) => w.status === 'notified').length;
    return { waiting, notified, total: waitingList.length };
  }, [waitingList]);

  const filtered = useMemo(() => {
    if (filter === 'all') return waitingList;
    if (filter === 'history') return waitingList.filter((w) => w.status !== 'waiting' && w.status !== 'notified');
    return waitingList.filter((w) => w.status === filter);
  }, [waitingList, filter]);

  const selectedSeat = useMemo(() => seats.find((s) => s.id === selectedSeatId), [seats, selectedSeatId]);

  const handleAddWaiting = () => {
    const item = addWaiting(selectedSeatId || undefined);
    if (item) {
      Taro.showToast({ title: `候补登记成功，排位#${item.queuePosition}`, icon: 'success' });
    }
  };

  const handleCancel = (id: string) => {
    Taro.showModal({
      title: '取消候补',
      content: '确认取消该候补请求？',
      success: (res) => {
        if (res.confirm) {
          cancelWaiting(id);
          Taro.showToast({ title: '已取消候补', icon: 'none' });
        }
      }
    });
  };

  const handleConfirm = (id: string) => {
    const booking = confirmWaiting(id);
    if (booking) {
      Taro.showToast({ title: `补位成功！座位${booking.seatCode}，请15分钟内签到`, icon: 'success', duration: 3000 });
    } else {
      Taro.showToast({ title: '补位失败，座位已被占用', icon: 'none' });
    }
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'waiting', label: '排队中' },
    { key: 'notified', label: '待确认' },
    { key: 'confirmed', label: '已补位' },
    { key: 'history', label: '历史' }
  ];

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>候补补位中心</Text>
        <Text className={styles.heroSub}>座位释放后自动按顺序通知补位</Text>
        <View className={styles.stats}>
          <View className={styles.statBox}>
            <Text className={styles.statNum}>{stats.waiting}</Text>
            <Text className={styles.statLabel}>排队中</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.statNum}>{stats.notified}</Text>
            <Text className={styles.statLabel}>待确认</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>累计</Text>
          </View>
        </View>
      </View>

      {stats.notified > 0 && (
        <View className={styles.notifiedBanner}>
          <Text className={styles.notifiedBannerIcon}>🔔</Text>
          <Text className={styles.notifiedBannerText}>
            您有 {stats.notified} 条候补待确认，请尽快处理（10分钟内有效）
          </Text>
        </View>
      )}

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>快速候补登记</Text>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>目标座位</Text>
          <Text className={styles.formValue}>{selectedSeat ? selectedSeat.code : '任意空位（全局）'}</Text>
        </View>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>目标时段</Text>
          <Text className={styles.formValue}>
            {formatTime(`2000-01-01 ${startTime}`)} - {formatTime(`2000-01-01 ${endTime}`)}
          </Text>
        </View>
        <Button className={styles.addBtn} onClick={handleAddWaiting}>
          ➕ 加入候补队列
        </Button>
      </View>

      <View className={styles.filterTabs}>
        {filters.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.tab, filter === f.key && styles.tabActive)}
            onClick={() => setFilter(f.key)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>暂无候补记录</Text>
          <Text className={styles.emptyHint}>座位已满时可加入候补队列</Text>
        </View>
      ) : (
        filtered.map((item) => (
          <WaitingCard
            key={item.id}
            item={item}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          />
        ))
      )}
    </ScrollView>
  );
};

export default WaitingPage;
