import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

const Action = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.label} numberOfLines={2}>{label}</Text>
  </TouchableOpacity>
);

export default function QuickActions({ onTrack, onTasks, onLeaderboard, onRewards }) {
  return (
    <View style={styles.row}>
      <Action icon="play" label="Takibi Başlat" color={colors.primary} onPress={onTrack} />
      <Action icon="list" label="Görevler" color={colors.accentBlue} onPress={onTasks} />
      <Action icon="trophy" label="Liderlik" color={colors.gold} onPress={onLeaderboard} />
      <Action icon="gift" label="Ödüller" color={colors.accentPink} onPress={onRewards} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  action: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: radius.lg,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: { color: colors.textPrimary, fontSize: 11, textAlign: 'center', fontWeight: '600' },
});
