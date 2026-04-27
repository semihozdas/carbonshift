import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
};

const levelTitle = (lvl) => {
  if (!lvl || lvl < 3) return 'Çevre Çırağı';
  if (lvl < 6) return 'Eko Savaşçı';
  if (lvl < 10) return 'Yeşil Kahraman';
  if (lvl < 15) return 'Gezegen Koruyucu';
  return 'Çevre Efsanesi';
};

export default function HeroHeader({ user, onPressNotifications, unreadCount = 0 }) {
  const name = user?.full_name?.split(' ')[0] || 'Dostum';
  const level = user?.level || 1;

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.greeting}>{greeting()},</Text>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.levelPill}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={styles.levelText}>Lvl {level} · {levelTitle(level)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.bellBtn} onPress={onPressNotifications} activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  greeting: { color: colors.textSecondary, fontSize: 14 },
  name: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryGlowSoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignSelf: 'flex-start',
  },
  levelText: { color: colors.primary, fontSize: 12, fontWeight: '700', marginLeft: 4 },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
