import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

export default function CommunityTaskCard({ item }) {
  const current = Number(item.current_value || 0);
  const target = Number(item.target_value || 1);
  const pct = Math.min(100, (current / target) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="people" size={18} color={colors.accentBlue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
        </View>
        {item.reward_cc ? (
          <Text style={styles.reward}>+{item.reward_cc} CC</Text>
        ) : null}
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progress}>
        {current.toFixed(0)} / {target.toFixed(0)} {item.unit || 'km'} • {pct.toFixed(1)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.infoGlow,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  desc: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  reward: { color: colors.gold, fontSize: 13, fontWeight: '800', marginLeft: 8 },
  barBg: { height: 6, borderRadius: 3, backgroundColor: colors.bgGlass, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accentBlue, borderRadius: 3 },
  progress: { color: colors.textSecondary, fontSize: 11, marginTop: 6 },
});
