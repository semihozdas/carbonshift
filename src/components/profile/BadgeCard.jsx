import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

const ICON_MAP = {
  sprout: 'leaf',
  medal: 'medal',
  trophy: 'trophy',
  flame: 'flame',
  shield: 'shield-checkmark',
  bus: 'bus',
  bicycle: 'bicycle',
  walk: 'walk',
  leaf: 'leaf',
};

const RARITY_COLOR = {
  common: colors.rarityCommon,
  rare: colors.rarityRare,
  epic: colors.rarityEpic,
  legendary: colors.rarityLegendary,
};

export default function BadgeCard({ badge }) {
  const earned = !!badge.is_earned;
  const color = badge.color || RARITY_COLOR[badge.rarity] || colors.primary;
  const icon = ICON_MAP[badge.icon] || 'medal';
  return (
    <View style={[styles.card, !earned && styles.locked]}>
      <View style={[styles.iconWrap, { backgroundColor: earned ? color + '22' : colors.bgGlass, borderColor: earned ? color : colors.border }]}>
        <Ionicons name={earned ? icon : 'lock-closed'} size={22} color={earned ? color : colors.textMuted} />
      </View>
      <Text style={[styles.name, !earned && { color: colors.textMuted }]} numberOfLines={2}>{badge.name}</Text>
      {earned ? (
        <Text style={styles.rarity}>{(badge.rarity || 'common').toUpperCase()}</Text>
      ) : (
        <Text style={styles.lockedText}>Kilitli</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: 12,
    borderRadius: radius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locked: { opacity: 0.6 },
  iconWrap: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
  },
  name: { color: colors.textPrimary, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  rarity: { color: colors.textMuted, fontSize: 9, marginTop: 4, letterSpacing: 0.5 },
  lockedText: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
});
