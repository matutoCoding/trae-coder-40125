import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useStudyRoomStore } from '@/store';
import { calculateBillingSegments, calculateTotalAmount, formatMinutes, getRateTypeLabel } from '@/utils/billing';
import { diffMinutes } from '@/utils/time';
import SeatGrid from '@/components/SeatGrid';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import styles from './index.module.scss';

const SeatPage: React.FC = () => {
  const {
    seats,
    selectedSeatId,
    selectedDate,
    startTime,
    endTime,
    rates,
    setSelectedDate,
    setStartTime,
    setEndTime,
    toggleSeatSelection,
    bookSeat,
    addWaiting,
    releaseTimeoutSeats,
    releaseAwayTimeout
  } = useStudyRoomStore();

  const [activeZone, setActiveZone] = useState('A区');
  const [segments, setSegments] = useState<ReturnType<typeof calculateBillingSegments>>([]);

  const dateTabs = useMemo(() => {
    const days = [];
    const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    for (let i = 0; i < 7; i++) {
      const d = dayjs().add(i, 'day');
      days.push({
        value: d.format('YYYY-MM-DD'),
        day: d.format('MM-DD'),
        week: i === 0 ? '今天' : i === 1 ? '明天' : weekLabels[d.day()]
      });
    }
    return days;
  }, []);

  const stats = useMemo(() => {
    const free = seats.filter((s) => s.status === 'free' && s.enabled).length;
    const occupied = seats.filter((s) => s.status === 'occupied').length;
    return { free, occupied, total: seats.filter((s) => s.enabled).length };
  }, [seats]);

  const selectedSeat = useMemo(() => seats.find((s) => s.id === selectedSeatId), [seats, selectedSeatId]);

  const enabledRates = useMemo(() => rates.filter((r) => r.enabled), [rates]);

  useEffect(() => {
    const start = `${selectedDate} ${startTime}`;
    const end = `${selectedDate} ${endTime}`;
    if (diffMinutes(start, end) > 0) {
      const segs = calculateBillingSegments(start, end, enabledRates);
      setSegments(segs);
    } else {
      setSegments([]);
    }
  }, [selectedDate, startTime, endTime, enabledRates]);

  const totalAmount = useMemo(() => calculateTotalAmount(segments), [segments]);
  const totalMinutes = useMemo(() => segments.reduce((s, x) => s + x.durationMinutes, 0), [segments]);

  useEffect(() => {
    const doRelease = () => {
      const r1 = releaseTimeoutSeats();
      const r2 = releaseAwayTimeout();
      const all = [...r1, ...r2];
      if (all.length > 0) {
        Taro.showToast({ title: `${all.length}个超时座位已释放`, icon: 'none' });
      }
    };
    doRelease();
    const timer = setInterval(doRelease, 60000);
    return () => clearInterval(timer);
  }, [releaseTimeoutSeats, releaseAwayTimeout]);

  const handleBook = () => {
    if (!selectedSeat) {
      Taro.showToast({ title: '请先选择座位', icon: 'none' });
      return;
    }
    if (totalMinutes <= 0) {
      Taro.showToast({ title: '请选择有效时段', icon: 'none' });
      return;
    }
    const booking = bookSeat();
    if (booking) {
      Taro.showToast({ title: '预订成功！请15分钟内签到', icon: 'success' });
      console.log('[SeatPage] 预订成功:', booking);
    }
  };

  const handleWaiting = () => {
    const item = addWaiting(selectedSeatId || undefined);
    if (item) {
      Taro.showToast({ title: `候补登记成功，排位#${item.queuePosition}`, icon: 'none' });
      console.log('[SeatPage] 候补登记:', item);
    }
  };

  const canBook = selectedSeat && totalMinutes > 0;

  const zones = useMemo(() => {
    const zoneSet = new Set(seats.filter((s) => s.enabled).map((s) => s.zone));
    return Array.from(zoneSet);
  }, [seats]);

  return (
    <ScrollView scrollY className={styles.page}>
      <View className="pageContainer">
        <View className={styles.header}>
          <View className={styles.hero}>
            <Text className={styles.heroTitle}>静读自习室</Text>
            <Text className={styles.heroSub}>专注学习，安静备考</Text>
            <View className={styles.stats}>
              <View className={styles.statItem}>
                <Text className={styles.statNum}>{stats.free}</Text>
                <Text className={styles.statLabel}>空闲座位</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statNum}>{stats.occupied}</Text>
                <Text className={styles.statLabel}>使用中</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statNum}>{stats.total}</Text>
                <Text className={styles.statLabel}>总座位</Text>
              </View>
            </View>
          </View>

          <ScrollView scrollX className={styles.dateTabs}>
            {dateTabs.map((d) => (
              <View
                key={d.value}
                className={classnames(styles.dateTab, selectedDate === d.value && styles.dateTabActive)}
                onClick={() => setSelectedDate(d.value)}
              >
                <Text className={styles.dateWeek}>{d.week}</Text>
                <View />
                <Text className={styles.dateDay}>{d.day}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="pageContainer">
          <TimeSlotPicker
            startTime={startTime}
            endTime={endTime}
            onStartChange={setStartTime}
            onEndChange={setEndTime}
          />

          {segments.length > 0 && (
            <View className={styles.segPreview}>
              <Text className={styles.segTitle}>📊 分段计费明细（预估）</Text>
              <View style={{ marginTop: 8 }}>
                {segments.map((seg, idx) => (
                  <View
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8rpx 0'
                    }}
                  >
                    <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <View
                        style={{
                          fontSize: 20,
                          padding: '2rpx 10rpx',
                          borderRadius: 4,
                          color: seg.rateType === 'peak' ? '#F53F3F' : '#00B42A',
                          background: seg.rateType === 'peak' ? 'rgba(245,63,63,0.1)' : 'rgba(0,180,42,0.1)'
                        }}
                      >
                        {getRateTypeLabel(seg.rateType)}
                      </View>
                      <Text style={{ fontSize: 24, color: '#4E5969' }}>
                        {seg.startTime.slice(11)} - {seg.endTime.slice(11)} · {seg.durationMinutes}分 · ¥{seg.unitPrice}/时
                      </Text>
                    </View>
                    <Text style={{ fontSize: 26, fontWeight: 600, color: '#1D2129' }}>¥{seg.subtotal.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className={styles.zoneTabs}>
            {zones.map((z) => (
              <View
                key={z}
                className={classnames(styles.zoneTab, activeZone === z && styles.zoneTabActive)}
                onClick={() => setActiveZone(z)}
              >
                <Text>{z}</Text>
              </View>
            ))}
          </View>

          <SeatGrid
            seats={seats}
            selectedSeatId={selectedSeatId}
            onSeatClick={toggleSeatSelection}
            zone={activeZone}
          />

          <View style={{ height: 80 }} />
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          {selectedSeat ? (
            <>
              <Text className={styles.priceLabel}>
                {selectedSeat.code} · {formatMinutes(totalMinutes)}
              </Text>
              <Text className={styles.priceValue}>¥{totalAmount.toFixed(2)}</Text>
              <Text className={styles.priceHint}>含高峰/平峰分段计费</Text>
            </>
          ) : (
            <>
              <Text className={styles.priceLabel}>请选择座位</Text>
              <Text className={styles.priceValue}>¥--</Text>
              <Text className={styles.priceHint}>点击座位图标进行选择</Text>
            </>
          )}
        </View>

        <Button
          className={classnames(styles.btn, !canBook && styles.btnDisabled, styles.btnWarn)}
          onClick={handleWaiting}
        >
          候补
        </Button>

        <Button
          className={classnames(styles.btn, !canBook && styles.btnDisabled, styles.btnPrimary)}
          onClick={handleBook}
        >
          立即预订
        </Button>
      </View>
    </ScrollView>
  );
};

export default SeatPage;
