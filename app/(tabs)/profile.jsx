import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { colors, shadows, radius } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

const RARITY_COLORS = {
  common: colors.rarityCommon || '#64748B',
  rare: colors.rarityRare || '#3B82F6',
  epic: colors.rarityEpic || '#8B5CF6',
  legendary: colors.rarityLegendary || '#F59E0B',
};

const MENU = [
  { label: 'Bildirimler', icon: 'notifications-outline', color: colors.accentBlue },
  { label: 'Gizlilik', icon: 'lock-closed-outline', color: colors.accentPurple },
  { label: 'Ayarlar', icon: 'settings-outline', color: colors.textSecondary },
  { label: 'Yardım Merkezi', icon: 'help-circle-outline', color: colors.textSecondary },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, refreshUser } = useAuth();
  const xpBarAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.85)).current;

  const [summary, setSummary] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, badgeRes] = await Promise.all([
        api.get('/activities/summary'),
        api.get('/badges'),
      ]);
      setSummary(sumRes.data);
      setBadges(badgeRes.data || []);
    } catch (e) {
      console.warn('profile fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refreshUser();
    loadData();
  }, [loadData]));

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpMax = Math.pow(level, 2) * 100;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(xpBarAnim, { toValue: xpMax > 0 ? xp / xpMax : 0, duration: 1400, useNativeDriver: false }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1, duration: 2200, useNativeDriver: false }),
          Animated.timing(ringAnim, { toValue: 0, duration: 2200, useNativeDriver: false }),
        ])
      ),
      Animated.spring(avatarScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
    ]).start();
  }, [xp, xpMax]);

  const xpBarWidth = xpBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth');
  };

  const earnedBadges = badges.filter(b => b.earned_at || b.is_earned);
  const totalKm = Number(summary?.totals?.total_km || 0).toFixed(1);
  const totalCo2 = Number(summary?.totals?.total_co2 || 0).toFixed(1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero banner */}
      <View style={styles.heroBg}>
        <LinearGradient
          colors={['rgba(0,255,135,0.14)', 'rgba(0,255,135,0.04)', 'transparent']}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Profile section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Animated.View style={[styles.avatarRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
          <Animated.View style={[styles.avatarOuter, { transform: [{ scale: avatarScale }] }]}>
            <LinearGradient
              colors={[colors.backgroundElevated, colors.backgroundCard]}
              style={styles.avatarInner}
            >
              <Ionicons name="person" size={40} color={colors.primary} />
            </LinearGradient>
          </Animated.View>
          <View style={styles.levelRing}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark || colors.primary]}
              style={styles.levelBadge}
            >
              <Text style={styles.levelText}>{level}</Text>
            </LinearGradient>
          </View>
        </View>

        <Text style={styles.userName}>{user?.full_name || 'Kullanıcı'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={styles.rankRow}>
          <View style={styles.rankTag}>
            <Ionicons name="leaf" size={12} color={colors.primary} />
            <Text style={styles.rankLabel}>Seviye {level} Karbon Savaşçısı</Text>
          </View>
        </View>

        {/* XP bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={styles.xpValue}>{xp.toLocaleString()} / {xpMax.toLocaleString()}</Text>
          </View>
          <View style={styles.xpTrack}>
            <Animated.View style={[styles.xpFill, { width: xpBarWidth }]}>
              <LinearGradient
                colors={[colors.primaryLight || colors.primary, colors.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Stats */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            {[
              { label: 'Carbon Coin', value: (user?.cc_balance || 0).toLocaleString(), icon: 'star', color: colors.gold },
              { label: 'CO2 Tasarruf', value: `${totalCo2} kg`, icon: 'leaf', color: colors.primary },
              { label: 'Toplam Mesafe', value: `${totalKm} km`, icon: 'trail-sign', color: colors.accentBlue },
              { label: 'Rozet', value: String(earnedBadges.length), icon: 'ribbon', color: colors.accentPurple },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Badges */}
          {earnedBadges.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Rozetlerim ({earnedBadges.length})</Text>
              <View style={styles.badgesGrid}>
                {earnedBadges.map((b, i) => {
                  const rarityColor = RARITY_COLORS[b.rarity] || '#fff';
                  return (
                    <View key={b.id || i} style={[styles.badgeCard, { borderColor: rarityColor + '30' }]}>
                      <LinearGradient
                        colors={[rarityColor + '12', 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={[styles.badgeIconWrap, { backgroundColor: rarityColor + '18' }]}>
                        <Ionicons name={b.icon || 'ribbon'} size={22} color={rarityColor} />
                      </View>
                      <Text style={[styles.badgeName, { color: rarityColor }]} numberOfLines={2}>
                        {b.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </>
      )}

      {/* Menu */}
      <Text style={styles.sectionTitle}>Ayarlar</Text>
      <View style={styles.menuList}>
        {MENU.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuRow} activeOpacity={0.7}>
            <View style={[styles.menuIconWrap, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LinearGradient
          colors={['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.06)']}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="log-out-outline" size={18} color={colors.error || '#EF4444'} />
        <Text style={[styles.logoutText, { color: colors.error || '#EF4444' }]}>Çıkış Yap</Text>
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20 },
  loadingWrap: { paddingVertical: 24, alignItems: 'center' },

  heroBg: { height: 120, marginHorizontal: -20, position: 'relative', overflow: 'hidden' },

  profileSection: { alignItems: 'center', marginTop: -50, marginBottom: 24 },
  avatarContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 14, position: 'relative' },
  avatarRing: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: colors.primary,
  },
  avatarOuter: {
    width: 88, height: 88, borderRadius: 44,
    padding: 3, borderWidth: 2, borderColor: colors.primaryBorder,
    backgroundColor: colors.backgroundCard,
  },
  avatarInner: { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  levelRing: { position: 'absolute', bottom: -4, right: -4 },
  levelBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  levelText: { fontSize: 13, fontWeight: '900', color: '#000' },

  userName: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.3, marginBottom: 2 },
  userEmail: { fontSize: 12, color: colors.textMuted, fontWeight: '500', marginBottom: 10 },
  rankRow: { flexDirection: 'row', marginBottom: 20 },
  rankTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryGlowSoft, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primaryBorder,
  },
  rankLabel: { fontSize: 12, fontWeight: '700', color: colors.primary },

  xpSection: { width: '100%' },
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  xpValue: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  xpTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 3 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: '47%', alignItems: 'center', gap: 6,
    backgroundColor: colors.backgroundCard, borderRadius: radius.xl,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  statIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1.2, marginBottom: 12, marginTop: 4,
  },

  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  badgeCard: {
    width: '30%', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: colors.backgroundCard, borderRadius: radius.xl,
    borderWidth: 1, overflow: 'hidden',
  },
  badgeIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 13 },

  menuList: { gap: 8, marginBottom: 24 },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.backgroundCard, borderRadius: radius.xl,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  menuIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#fff' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: radius.xl, padding: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  logoutText: { fontSize: 15, fontWeight: '800' },
});
