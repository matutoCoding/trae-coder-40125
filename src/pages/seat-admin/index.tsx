import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

const SeatAdminPage: React.FC = () => {
  return (
    <View className={styles.page}>
      <Text className={styles.icon}>🪑</Text>
      <Text className={styles.title}>座位建档与管理</Text>
      <Text className={styles.hint}>功能正在开发中...</Text>
    </View>
  );
};

export default SeatAdminPage;
