import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

const daysLeft = (end) => {
  if (!end) return null;
  const ms = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
};

export default function CampaignCard({ item }) {
  const days = daysLeft(item.end_date);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="flash" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
        </View>
      </View>
      <View style={styles.footer}>
        {Number(item.cc_bonus_multiplier) > 1 && (
          <View style={styles.mult}>
            <Text style={styles.multText}>{Number(item.cc_bonus_multiplier).toFixed(1)}× CC</Text>
          </View>
        )}
        {days !== null && (
          <Text style={styles.timer}>
            <Ionicons name="time-outline" size={11} color={colors.textMuted} /> {days} gün
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    padding: 14,
    width: 280,
    marginRight: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryGlowSoft,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  desc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  mult: {
    backgroundColor: colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    marginRight: 8,
  },
  multText: { color: '#000', fontSize: 11, fontWeight: '800' },
  timer: { color: colors.textMuted, fontSize: 11 },
});
