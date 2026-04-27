import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

const ICONS = {
  walk: 'walk', bus: 'bus', bicycle: 'bicycle', leaf: 'leaf',
  trophy: 'trophy', flame: 'flame',
};

export default function TaskCard({ task, onClaim, claiming }) {
  const progress = Math.min(1, Number(task.progress || 0) / Math.max(1, Number(task.requirement_value)));
  const pct = Math.round(progress * 100);
  const done = task.is_completed;
  const claimed = task.is_claimed;

  return (
    <View style={[styles.card, done && !claimed && styles.cardGlow]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={ICONS[task.icon] || 'leaf'} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{task.title}</Text>
          {task.description ? <Text style={styles.desc}>{task.description}</Text> : null}
        </View>
        <View style={styles.reward}>
          <Text style={styles.rewardCC}>+{Number(task.cc_reward).toFixed(0)} CC</Text>
          {task.xp_reward ? <Text style={styles.rewardXP}>+{task.xp_reward} XP</Text> : null}
        </View>
      </View>

      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.progressText}>
          {Number(task.progress || 0).toFixed(1)} / {Number(task.requirement_value).toFixed(0)}
        </Text>
        {claimed ? (
          <View style={styles.badgeClaimed}>
            <Ionicons name="checkmark-circle" size={14} color={colors.textSecondary} />
            <Text style={styles.claimedText}>Alındı</Text>
          </View>
        ) : done ? (
          <TouchableOpacity style={styles.claimBtn} onPress={() => onClaim?.(task)} activeOpacity={0.85}>
            {claiming ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.claimText}>Ödülü Al</Text>}
          </TouchableOpacity>
        ) : (
          <Text style={styles.pctText}>{pct}%</Text>
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
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardGlow: {
    borderColor: colors.primaryBorderStrong,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryGlowSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  desc: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  reward: { alignItems: 'flex-end', marginLeft: 8 },
  rewardCC: { color: colors.gold, fontSize: 13, fontWeight: '800' },
  rewardXP: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  barBg: { height: 6, borderRadius: 3, backgroundColor: colors.bgGlass, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  progressText: { color: colors.textSecondary, fontSize: 11 },
  pctText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  claimBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  claimText: { color: '#000', fontWeight: '800', fontSize: 12 },
  badgeClaimed: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bgGlass,
  },
  claimedText: { color: colors.textSecondary, fontSize: 11, marginLeft: 4, fontWeight: '600' },
});
