import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../../theme/colors';

const XP_PER_LEVEL = 100;

export default function CarbonScoreCard({ ccBalance = 0, co2Saved = 0, xp = 0, level = 1 }) {
  const xpInLevel = Math.max(0, xp - (level - 1) * (level - 1) * XP_PER_LEVEL);
  const needed = level * level * XP_PER_LEVEL - (level - 1) * (level - 1) * XP_PER_LEVEL;
  const progress = Math.min(1, xpInLevel / needed);

  return (
    <LinearGradient
      colors={['rgba(0,255,135,0.22)', 'rgba(0,255,135,0.04)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.neonGreenSoft]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>CarbonCoin</Text>
          <Text style={styles.value}>{Math.floor(Number(ccBalance)).toLocaleString('tr-TR')}<Text style={styles.unit}> CC</Text></Text>
        </View>
        <View style={styles.divider} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>CO₂ Tasarrufu</Text>
          <Text style={styles.value}>{Number(co2Saved).toFixed(2)}<Text style={styles.unit}> kg</Text></Text>
        </View>
      </View>

      <View style={styles.levelRow}>
        <Ionicons name="trophy" size={14} color={colors.primary} />
        <Text style={styles.levelText}>
          Seviye {level} · {Math.max(0, needed - xpInLevel)} XP sonraki seviye
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  divider: { width: 1, height: 42, backgroundColor: colors.borderMedium, marginHorizontal: 18 },
  label: { color: colors.textSecondary, fontSize: 11, marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  unit: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  levelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 8 },
  levelText: { color: colors.textSecondary, fontSize: 12, marginLeft: 6 },
  barBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgGlass,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
});
