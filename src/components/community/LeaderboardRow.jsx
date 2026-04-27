import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

const medalColor = (rank) => {
  if (rank === 1) return colors.gold;
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return colors.textMuted;
};

export default function LeaderboardRow({ rank, user, isMe }) {
  const name = user.full_name || user.email?.split('@')[0] || 'Kullanıcı';
  return (
    <View style={[styles.row, isMe && styles.myRow]}>
      <View style={styles.rankWrap}>
        {rank <= 3 ? (
          <Ionicons name="trophy" size={18} color={medalColor(rank)} />
        ) : (
          <Text style={styles.rankText}>{rank}</Text>
        )}
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name} numberOfLines={1}>{isMe ? `${name} (Sen)` : name}</Text>
        <Text style={styles.sub}>
          Lvl {user.level || 1} · {Number(user.km_period).toFixed(1)} km
        </Text>
      </View>
      <Text style={styles.cc}>{Math.floor(Number(user.cc_period || 0))} CC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  myRow: {
    borderColor: colors.primaryBorderStrong,
    backgroundColor: colors.primaryGlowSoft,
  },
  rankWrap: { width: 28, alignItems: 'center' },
  rankText: { color: colors.textSecondary, fontWeight: '700' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  avatarText: { color: colors.primary, fontWeight: '800' },
  name: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  cc: { color: colors.gold, fontSize: 14, fontWeight: '800' },
});
