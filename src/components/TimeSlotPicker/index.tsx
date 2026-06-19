import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { generateTimeSlots } from '@/utils/time';
import { diffMinutes, formatMinutes } from '@/utils/time';
import styles from './index.module.scss';

interface TimeSlotPickerProps {
  startTime: string;
  endTime: string;
  onStartChange: (t: string) => void;
  onEndChange: (t: string) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  startTime,
  endTime,
  onStartChange,
  onEndChange
}) => {
  const slots = useMemo(() => generateTimeSlots(8, 23, 30), []);

  const endSlots = useMemo(() => {
    const startIdx = slots.findIndex((s) => s.value === startTime);
    return slots.slice(Math.max(0, startIdx + 1));
  }, [slots, startTime]);

  const duration = useMemo(() => {
    const start = `2000-01-01 ${startTime}`;
    const end = `2000-01-01 ${endTime}`;
    const mins = diffMinutes(start, end);
    return mins > 0 ? formatMinutes(mins) : '请选择结束时间';
  }, [startTime, endTime]);

  return (
    <View className={styles.wrapper}>
      <Text className={styles.label}>选择时段</Text>

      <View className={styles.row}>
        <View className={styles.slotGroup}>
          <Text className={styles.groupLabel}>开始时间</Text>
          <ScrollView scrollX className={styles.slots}>
            {slots.map((s) => {
              const isEndDisabled = endTime && s.value >= endTime;
              return (
                <View
                  key={s.value}
                  className={classnames(
                    styles.slot,
                    s.value === startTime && styles.slotActive,
                    isEndDisabled && styles.slotDisabled
                  )}
                  onClick={() => !isEndDisabled && onStartChange(s.value)}
                >
                  <Text>{s.label}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <Text className={styles.arrow}>→</Text>

        <View className={styles.slotGroup}>
          <Text className={styles.groupLabel}>结束时间</Text>
          <ScrollView scrollX className={styles.slots}>
            {endSlots.length > 0 ? (
              endSlots.map((s) => (
                <View
                  key={s.value}
                  className={classnames(styles.slot, s.value === endTime && styles.slotActive)}
                  onClick={() => onEndChange(s.value)}
                >
                  <Text>{s.label}</Text>
                </View>
              ))
            ) : (
              <View className={classnames(styles.slot, styles.slotDisabled)}>
                <Text>请先选开始</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <View className={styles.duration}>
        <Text className={styles.durationLabel}>学习时长</Text>
        <Text className={styles.durationValue}>{duration}</Text>
      </View>
    </View>
  );
};

export default TimeSlotPicker;
