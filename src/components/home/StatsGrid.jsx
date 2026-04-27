import React from 'react';
import { View, StyleSheet } from 'react-native';
import StatCard from '../ui/StatCard';
import { colors } from '../../theme/colors';

export default function StatsGrid({ steps = 0, distance = 0, cc = 0, co2 = 0 }) {
  return (
    <View style={styles.row}>
      <StatCard label="Adım" value={Math.round(Number(steps)).toLocaleString('tr-TR')} icon="walk" color={colors.primary} />
      <View style={{ width: 10 }} />
      <StatCard label="Mesafe" value={Number(distance).toFixed(2)} suffix="km" icon="map" color={colors.accentBlue} />
      <View style={{ width: 10 }} />
      <StatCard label="Kazanılan" value={Number(cc).toFixed(0)} suffix="CC" icon="leaf" color={colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
