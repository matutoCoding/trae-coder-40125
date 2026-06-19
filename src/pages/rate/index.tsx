import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

const RatePage: React.FC = () => {
  return (
    <View className={styles.page}>
      <Text className={styles.icon}>📋</Text>
      <Text className={styles.title}>时段费率管理</Text>
      <Text className={styles.hint}>功能正在开发中...</Text>
    </View>
  );
};

export default RatePage;
