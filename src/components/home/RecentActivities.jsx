import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

const MODE_META = {
  walk: { icon: 'walk', color: colors.modeWalk, label: 'Yürüyüş' },
  bus: { icon: 'bus', color: colors.modeBus, label: 'Otobüs' },
  bike: { icon: 'bicycle', color: colors.modeBike, label: 'Bisiklet' },
  car: { icon: 'car', color: colors.modeCar, label: 'Araba' },
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
};

export default function RecentActivities({ items = [] }) {
  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="footsteps-outline" size={28} color={colors.textMuted} />
        <Text style={styles.emptyText}>Henüz aktivite yok. Takibi başlatıp ilk yolculuğunu kaydet!</Text>
      </View>
    );
  }
  return (
    <View style={{ marginTop: 12 }}>
      {items.map((a) => {
        const meta = MODE_META[a.transport_mode] || MODE_META.walk;
        const cc = Number(a.cc_earned);
        return (
          <View key={a.id} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
              <Ionicons name={meta.icon} size={18} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {meta.label} · {Number(a.distance_km).toFixed(2)} km
                {a.is_anomaly ? ' ⚠️' : ''}
              </Text>
              <Text style={styles.sub}>{timeAgo(a.created_at)}</Text>
            </View>
            <Text style={[styles.cc, { color: cc >= 0 ? colors.primary : colors.error }]}>
              {cc >= 0 ? '+' : ''}{cc.toFixed(0)} CC
            </Text>
          </View>
        );
      })}
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
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  cc: { fontSize: 14, fontWeight: '800' },
  empty: {
    marginTop: 12,
    padding: 24,
    borderRadius: radius.xl,
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 13 },
});
