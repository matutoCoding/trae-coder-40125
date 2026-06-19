import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Input, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useStudyRoomStore } from '@/store';
import { getRateTypeLabel } from '@/utils/billing';
import type { RateType } from '@/types';
import styles from './index.module.scss';

const RATE_TYPES: { value: RateType; label: string }[] = [
  { value: 'offpeak', label: '平峰' },
  { value: 'peak', label: '高峰' },
  { value: 'normal', label: '标准' }
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const RatePage: React.FC = () => {
  const { rates, addRate, updateRate, toggleRateEnabled } = useStudyRoomStore();

  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formTypeIdx, setFormTypeIdx] = useState(0);
  const [formStartIdx, setFormStartIdx] = useState(0);
  const [formEndIdx, setFormEndIdx] = useState(4);
  const [formPrice, setFormPrice] = useState('5');

  const handleSave = () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入费率名称', icon: 'none' });
      return;
    }
    if (!formPrice || Number(formPrice) <= 0) {
      Taro.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }

    const data = {
      name: formName.trim(),
      type: RATE_TYPES[formTypeIdx].value,
      startTime: TIME_OPTIONS[formStartIdx],
      endTime: TIME_OPTIONS[formEndIdx],
      pricePerHour: Number(formPrice),
      dayOfWeek: [1, 2, 3, 4, 5, 6, 7],
      enabled: true
    };

    if (editingRate) {
      updateRate(editingRate, data);
      Taro.showToast({ title: '费率已更新', icon: 'success' });
    } else {
      addRate(data);
      Taro.showToast({ title: '费率已新增', icon: 'success' });
    }
    resetForm();
  };

  const handleEdit = (rateId: string) => {
    const rate = rates.find((r) => r.id === rateId);
    if (!rate) return;
    setEditingRate(rateId);
    setFormName(rate.name);
    setFormTypeIdx(RATE_TYPES.findIndex((t) => t.value === rate.type));
    setFormStartIdx(TIME_OPTIONS.indexOf(rate.startTime));
    setFormEndIdx(TIME_OPTIONS.indexOf(rate.endTime));
    setFormPrice(String(rate.pricePerHour));
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingRate(null);
    setShowForm(false);
    setFormName('');
    setFormTypeIdx(0);
    setFormStartIdx(0);
    setFormEndIdx(4);
    setFormPrice('5');
  };

  const getTypeColor = (type: RateType) => {
    if (type === 'peak') return styles.typePeak;
    if (type === 'offpeak') return styles.typeOffpeak;
    return styles.typeNormal;
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>📋 时段费率管理</Text>
        <Text className={styles.heroSub}>维护各时段价格，停用后不再参与计费</Text>
      </View>

      <View className={styles.container}>
        <Button className={styles.addBtn} onClick={() => { resetForm(); setShowForm(true); }}>
          ➕ 新增费率
        </Button>

        {showForm && (
          <View className={styles.formCard}>
            <Text className={styles.formTitle}>{editingRate ? '编辑费率' : '新增费率'}</Text>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>名称</Text>
              <Input
                className={styles.formInput}
                value={formName}
                onInput={(e) => setFormName(e.detail.value)}
                placeholder="如 午间高峰"
              />
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>类型</Text>
              <Picker mode="selector" range={RATE_TYPES.map((t) => t.label)} value={formTypeIdx} onChange={(e) => setFormTypeIdx(Number(e.detail.value))}>
                <Text className={styles.formPicker}>{RATE_TYPES[formTypeIdx].label} ▾</Text>
              </Picker>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>开始时间</Text>
              <Picker mode="selector" range={TIME_OPTIONS} value={formStartIdx} onChange={(e) => setFormStartIdx(Number(e.detail.value))}>
                <Text className={styles.formPicker}>{TIME_OPTIONS[formStartIdx]} ▾</Text>
              </Picker>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>结束时间</Text>
              <Picker mode="selector" range={TIME_OPTIONS} value={formEndIdx} onChange={(e) => setFormEndIdx(Number(e.detail.value))}>
                <Text className={styles.formPicker}>{TIME_OPTIONS[formEndIdx]} ▾</Text>
              </Picker>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>单价（元/时）</Text>
              <Input
                className={styles.formInputSmall}
                type="digit"
                value={formPrice}
                onInput={(e) => setFormPrice(e.detail.value)}
              />
            </View>

            <View className={styles.formBtns}>
              <Button className={styles.formBtnGhost} onClick={resetForm}>取消</Button>
              <Button className={styles.formBtnPrimary} onClick={handleSave}>保存</Button>
            </View>
          </View>
        )}

        {rates.map((rate) => (
          <View key={rate.id} className={styles.rateItem}>
            <View className={styles.rateLeft}>
              <Text className={`${styles.rateTypeTag} ${getTypeColor(rate.type)}`}>
                {getRateTypeLabel(rate.type)}
              </Text>
              <View className={styles.rateInfo}>
                <Text className={styles.rateName}>{rate.name}</Text>
                <Text className={styles.rateTime}>{rate.startTime} - {rate.endTime}</Text>
              </View>
            </View>
            <View className={styles.rateRight}>
              <Text className={styles.ratePrice}>¥{rate.pricePerHour}/时</Text>
              <Text className={rate.enabled ? styles.tagEnabled : styles.tagDisabled}>
                {rate.enabled ? '启用' : '停用'}
              </Text>
              <Button className={styles.editBtn} onClick={() => handleEdit(rate.id)}>编辑</Button>
              <Button
                className={rate.enabled ? styles.disableBtn : styles.enableBtn}
                onClick={() => toggleRateEnabled(rate.id)}
              >
                {rate.enabled ? '停用' : '启用'}
              </Button>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default RatePage;
