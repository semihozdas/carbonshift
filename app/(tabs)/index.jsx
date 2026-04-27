import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors, shadows, radius } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

const { width } = Dimensions.get('window');

function useCounter(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
    if (!target) { setVal(0); return; }
    const start = Date.now();
    const from = val;
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) { setVal(target); clearInterval(tick); return; }
      const t = 1 - Math.pow(1 - elapsed / duration, 3);
      setVal(Math.floor(from + t * (target - from)));
    }, 16);
    return () => clearInterval(tick);
  }, [target]);
  return val;
}

const MODE_ICON = { walk: 'walk', bus: 'bus', bike: 'bicycle', car: 'car', bicycle: 'bicycle' };
const MODE_COLOR = { walk: colors.primary, bus: colors.accentBlue, bike: colors.gold, bicycle: colors.gold, car: colors.error };
const MODE_LABEL = { walk: 'Yürüdün', bus: 'Toplu taşıma kullandın', bike: 'Bisiklet sürdün', bicycle: 'Bisiklet sürdün', car: 'Araç kullandın' };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Az önce';
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  return `${Math.floor(hr / 24)} gün önce`;
}

function ScoreCard({ cc, co2, level, xp }) {
  const score = useCounter(Math.round(cc));
  const xpMax = Math.pow(level, 2) * 100;
  const barAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.timing(barAnim, { toValue: xpMax > 0 ? xp / xpMax : 0, duration: 1600, useNativeDriver: false }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [xp, xpMax]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] });

  return (
    <View style={styles.scoreCard}>
      <LinearGradient
        colors={['rgba(0,255,135,0.07)', 'rgba(0,255,135,0.02)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.scoreCardGlow, { opacity: glowOpacity }]} />
      <View style={styles.scoreTopRow}>
        <View style={styles.scoreLabelRow}>
          <View style={styles.greenDot} />
          <Text style={styles.scoreLabel}>KARBON SKORUM</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>SEVİYE {level}</Text>
        </View>
      </View>
      <View style={styles.scoreMidRow}>
        <View>
          <Text style={styles.scoreNumber}>{score.toLocaleString()}</Text>
          <Text style={styles.scoreCurrency}>Carbon Coin</Text>
        </View>
        <View style={styles.co2Block}>
          <LinearGradient
            colors={['rgba(0,255,135,0.15)', 'rgba(0,255,135,0.05)']}
            style={styles.co2Badge}
          >
            <Ionicons name="leaf" size={16} color={colors.primary} />
            <Text style={styles.co2Value}>{Number(co2).toFixed(1)} kg</Text>
          </LinearGradient>
          <Text style={styles.co2Label}>CO2 tasarruf</Text>
        </View>
      </View>
      <View style={styles.xpRow}>
        <View style={styles.xpBarBg}>
          <Animated.View style={[styles.xpBarFill, { width: barWidth }]}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.xpText}>{xp.toLocaleString()} / {xpMax.toLocaleString()} XP</Text>
      </View>
    </View>
  );
}

function StreakBanner({ streak }) {
  const flameScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameScale, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(flameScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.streakBanner}>
      <LinearGradient
        colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={{ transform: [{ scale: flameScale }] }}>
        <Ionicons name="flame" size={22} color="#F59E0B" />
      </Animated.View>
      <View style={styles.streakMid}>
        <Text style={styles.streakTitle}>
          {streak > 0 ? `${streak} Günlük Seri!` : 'Seri Yok'}
        </Text>
        <Text style={styles.streakSub}>
          {streak > 0 ? 'Harika gidiyorsun, devam et' : 'Bugün bir aktivite kaydet'}
        </Text>
      </View>
      <View style={styles.streakRight}>
        <Text style={styles.streakDays}>{streak}</Text>
        <Text style={styles.streakDayLabel}>gün</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, activityVersion, latestActivity } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [summary, setSummary] = useState(null);
  const [streak, setStreak] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, streakRes, actRes] = await Promise.all([
        api.get('/activities/summary'),
        api.get('/streak'),
        api.get('/activities?limit=5'),
      ]);
      setSummary(sumRes.data);
      setStreak(streakRes.data.current_streak || 0);
      setActivities(actRes.data || []);
    } catch (e) {
      console.warn('HomeScreen fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  // Refresh instantly when a new activity is submitted (even without navigation)
  useEffect(() => {
    if (activityVersion > 0) loadData();
  }, [activityVersion]);

  // Optimistic update for instant display
  useEffect(() => {
    if (latestActivity) {
      setActivities(prev => {
        if (prev.some(a => a.id === latestActivity.id)) return prev;
        return [latestActivity, ...prev].slice(0, 5);
      });
      setSummary(prev => {
        if (!prev) return prev;
        const today = prev.today || {};
        return {
          ...prev,
          today: {
            ...today,
            steps: Number(today.steps || 0) + Number(latestActivity.step_count || 0),
            km: Number(today.km || 0) + Number(latestActivity.distance_km || 0),
            co2: Number(today.co2 || 0) + Number(latestActivity.co2_saved || 0),
            cc: Number(today.cc || 0) + Number(latestActivity.cc_earned || 0),
          }
        };
      });
    }
  }, [latestActivity]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const today = summary?.today || {};
  const todaySteps = Math.round(Number(today.steps) || 0);
  const todayKm = Number(today.km || 0).toFixed(1);
  const todayCc = Math.round(Number(today.cc) || 0);

  const STATS = [
    { label: 'Adım', value: todaySteps.toLocaleString(), icon: 'footsteps', color: colors.primary },
    { label: 'Mesafe', value: `${todayKm} km`, icon: 'trail-sign', color: colors.accentBlue },
    { label: 'Kazandı', value: `+${todayCc} CC`, icon: 'star', color: colors.gold },
  ];

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={['rgba(0,255,135,0.06)', colors.background, colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.appName}>Carbon<Text style={{ color: colors.primary }}>Shift</Text></Text>
            <Text style={styles.greeting}>
              Merhaba, {user?.full_name?.split(' ')[0] || 'Kullanıcı'}
            </Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <>
            <ScoreCard
              cc={user?.cc_balance || 0}
              co2={user?.total_co2_saved || 0}
              level={user?.level || 1}
              xp={user?.xp || 0}
            />
            <StreakBanner streak={streak} />

            <Text style={styles.sectionTitle}>Bugün</Text>
            <View style={styles.statsRow}>
              {STATS.map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: s.color + '1A' }]}>
                    <Ionicons name={s.icon} size={18} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
            <View style={styles.activityList}>
              {activities.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="navigate-outline" size={28} color={colors.textMuted} />
                  <Text style={styles.emptyText}>Henüz aktivite yok. Haritaya git ve seyahat kaydet!</Text>
                </View>
              ) : activities.map((a, i) => {
                const mode = a.transport_mode || 'walk';
                const icon = MODE_ICON[mode] || 'walk';
                const color = MODE_COLOR[mode] || colors.primary;
                const label = MODE_LABEL[mode] || 'Aktivite';
                const cc = Number(a.cc_earned || 0);
                return (
                  <View key={a.id || i} style={styles.activityRow}>
                    <View style={[styles.activityIconWrap, { backgroundColor: color + '1A' }]}>
                      <Ionicons name={icon} size={18} color={color} />
                    </View>
                    <View style={styles.activityMid}>
                      <Text style={styles.activityLabel}>
                        {Number(a.distance_km).toFixed(1)} km {label}
                      </Text>
                      <Text style={styles.activitySub}>{timeAgo(a.created_at)}</Text>
                    </View>
                    <View style={[styles.ccBadge, { backgroundColor: color + '1A' }]}>
                      <Text style={[styles.ccBadgeText, { color }]}>
                        {cc >= 0 ? `+${cc.toFixed(0)}` : cc.toFixed(0)} CC
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 24,
  },
  appName: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 1.5, opacity: 0.6, marginBottom: 4 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.bgGlass,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5, borderColor: colors.background,
  },

  scoreCard: {
    borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.primaryBorder,
    padding: 20, marginBottom: 14, overflow: 'hidden', backgroundColor: colors.backgroundCard,
  },
  scoreCardGlow: {
    position: 'absolute', top: -30, left: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: colors.primary, opacity: 0.06,
  },
  scoreTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  scoreLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greenDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary,
    shadowColor: colors.primary, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  scoreLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5 },
  levelBadge: {
    backgroundColor: colors.primaryGlowSoft, borderWidth: 1, borderColor: colors.primaryBorder,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill,
  },
  levelText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  scoreMidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 },
  scoreNumber: { fontSize: 52, fontWeight: '900', color: colors.primary, letterSpacing: -2, lineHeight: 56 },
  scoreCurrency: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  co2Block: { alignItems: 'flex-end' },
  co2Badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: 6,
  },
  co2Value: { fontSize: 18, fontWeight: '800', color: colors.primary },
  co2Label: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  xpRow: { gap: 8 },
  xpBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 3 },
  xpText: { fontSize: 11, color: colors.textMuted, textAlign: 'right', fontWeight: '600' },

  streakBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    padding: 14, marginBottom: 24, overflow: 'hidden', backgroundColor: colors.backgroundCard,
  },
  streakMid: { flex: 1 },
  streakTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  streakSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  streakRight: { alignItems: 'center' },
  streakDays: { fontSize: 26, fontWeight: '900', color: '#F59E0B', lineHeight: 28 },
  streakDayLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.2, marginBottom: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.xl, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  activityList: { gap: 8, marginBottom: 10 },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.xl, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  activityIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  activityMid: { flex: 1 },
  activityLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  activitySub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  ccBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  ccBadgeText: { fontSize: 13, fontWeight: '800' },

  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 32, backgroundColor: colors.backgroundCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
});
