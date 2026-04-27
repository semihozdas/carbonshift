import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

export default function StreakBanner({ count = 0, longest = 0 }) {
  const safe = Math.max(0, Number(count) || 0);
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="flame" size={22} color={colors.warning} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {safe > 0 ? `${safe} Günlük Seri!` : 'Seri Başlat'}
        </Text>
        <Text style={styles.sub}>
          {safe > 0
            ? `Pes etme — dünyayı kurtarıyorsun. En uzun: ${longest} gün`
            : 'Bugün ilk aktiviteni yap ve seriyi başlat.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.xl,
    marginTop: 16,
    backgroundColor: colors.warningGlow,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245,158,11,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { color: colors.warning, fontSize: 15, fontWeight: '800' },
  sub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
