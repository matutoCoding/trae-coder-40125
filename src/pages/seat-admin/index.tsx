import React, { useMemo, useState } from 'react';
import { View, Text, Button, ScrollView, Input, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStudyRoomStore } from '@/store';
import { getSeatTypeName } from '@/data/seats';
import type { SeatType } from '@/types';
import styles from './index.module.scss';

const SEAT_TYPES: { value: SeatType; label: string }[] = [
  { value: 'standard', label: '标准座' },
  { value: 'window', label: '靠窗座' },
  { value: 'single', label: '单人间' },
  { value: 'sofa', label: '沙发座' }
];

const SeatAdminPage: React.FC = () => {
  const { seats, addSeat, updateSeat, toggleSeatEnabled } = useStudyRoomStore();

  const [editingSeat, setEditingSeat] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formZone, setFormZone] = useState('A区');
  const [formTypeIdx, setFormTypeIdx] = useState(0);
  const [formRow, setFormRow] = useState('1');
  const [formCol, setFormCol] = useState('1');

  const zones = useMemo(() => {
    const zoneSet = new Set(seats.map((s) => s.zone));
    return Array.from(zoneSet);
  }, [seats]);

  const handleSave = () => {
    if (!formCode.trim()) {
      Taro.showToast({ title: '请输入座位编号', icon: 'none' });
      return;
    }

    if (editingSeat) {
      updateSeat(editingSeat, {
        code: formCode.trim(),
        zone: formZone,
        type: SEAT_TYPES[formTypeIdx].value,
        row: parseInt(formRow) || 1,
        col: parseInt(formCol) || 1
      });
      Taro.showToast({ title: '座位已更新', icon: 'success' });
    } else {
      addSeat({
        code: formCode.trim(),
        zone: formZone,
        type: SEAT_TYPES[formTypeIdx].value,
        row: parseInt(formRow) || 1,
        col: parseInt(formCol) || 1,
        status: 'free',
        enabled: true
      });
      Taro.showToast({ title: '座位已新增', icon: 'success' });
    }

    resetForm();
  };

  const handleEdit = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat) return;
    setEditingSeat(seatId);
    setFormCode(seat.code);
    setFormZone(seat.zone);
    setFormTypeIdx(SEAT_TYPES.findIndex((t) => t.value === seat.type));
    setFormRow(String(seat.row));
    setFormCol(String(seat.col));
    setShowForm(true);
  };

  const handleToggle = (seatId: string) => {
    toggleSeatEnabled(seatId);
  };

  const resetForm = () => {
    setEditingSeat(null);
    setShowForm(false);
    setFormCode('');
    setFormZone('A区');
    setFormTypeIdx(0);
    setFormRow('1');
    setFormCol('1');
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>🪑 座位管理</Text>
        <Text className={styles.heroSub}>新增、编辑、启用/停用座位</Text>
      </View>

      <View className={styles.container}>
        <Button className={styles.addBtn} onClick={() => { resetForm(); setShowForm(true); }}>
          ➕ 新增座位
        </Button>

        {showForm && (
          <View className={styles.formCard}>
            <Text className={styles.formTitle}>{editingSeat ? '编辑座位' : '新增座位'}</Text>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>座位编号</Text>
              <Input
                className={styles.formInput}
                value={formCode}
                onInput={(e) => setFormCode(e.detail.value)}
                placeholder="如 A1-3"
              />
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>所属区域</Text>
              <Picker mode="selector" range={zones} value={zones.indexOf(formZone)} onChange={(e) => setFormZone(zones[Number(e.detail.value)])}>
                <Text className={styles.formPicker}>{formZone} ▾</Text>
              </Picker>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>座位类型</Text>
              <Picker mode="selector" range={SEAT_TYPES.map((t) => t.label)} value={formTypeIdx} onChange={(e) => setFormTypeIdx(Number(e.detail.value))}>
                <Text className={styles.formPicker}>{SEAT_TYPES[formTypeIdx].label} ▾</Text>
              </Picker>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>行号</Text>
              <Input
                className={styles.formInputSmall}
                type="number"
                value={formRow}
                onInput={(e) => setFormRow(e.detail.value)}
              />
              <Text className={styles.formLabel}>列号</Text>
              <Input
                className={styles.formInputSmall}
                type="number"
                value={formCol}
                onInput={(e) => setFormCol(e.detail.value)}
              />
            </View>

            <View className={styles.formBtns}>
              <Button className={styles.formBtnGhost} onClick={resetForm}>取消</Button>
              <Button className={styles.formBtnPrimary} onClick={handleSave}>保存</Button>
            </View>
          </View>
        )}

        {zones.map((zone) => {
          const zoneSeats = seats.filter((s) => s.zone === zone);
          return (
            <View key={zone} className={styles.zoneSection}>
              <Text className={styles.zoneTitle}>{zone}（{zoneSeats.length}个）</Text>
              {zoneSeats.map((seat) => (
                <View key={seat.id} className={styles.seatItem}>
                  <View className={styles.seatLeft}>
                    <Text className={styles.seatCode}>{seat.code}</Text>
                    <Text className={styles.seatType}>{getSeatTypeName(seat.type)}</Text>
                    <Text className={seat.enabled ? styles.tagEnabled : styles.tagDisabled}>
                      {seat.enabled ? '启用' : '停用'}
                    </Text>
                  </View>
                  <View className={styles.seatRight}>
                    <Button className={styles.editBtn} onClick={() => handleEdit(seat.id)}>编辑</Button>
                    <Button
                      className={seat.enabled ? styles.disableBtn : styles.enableBtn}
                      onClick={() => handleToggle(seat.id)}
                    >
                      {seat.enabled ? '停用' : '启用'}
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default SeatAdminPage;
