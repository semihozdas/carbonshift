import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors, radius, shadows } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

const RANK_COLORS = {
  1: { bg: '#F59E0B', glow: 'rgba(245,158,11,0.25)', label: 'Altın' },
  2: { bg: '#94A3B8', glow: 'rgba(148,163,184,0.2)', label: 'Gümüş' },
  3: { bg: '#CD7F32', glow: 'rgba(205,127,50,0.2)', label: 'Bronz' },
};

const PERIOD_LABELS = { week: 'Haftalık', month: 'Aylık', all: 'Tüm Zamanlar' };
const PERIODS = ['week', 'month', 'all'];

function PodiumItem({ item, position }) {
  const rColor = RANK_COLORS[item.rank];
  const heights = { 1: 90, 2: 72, 3: 60 };
  const h = heights[position] || 60;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: position * 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: position * 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const cc = Number(item.cc_period || 0);
  return (
    <Animated.View style={[styles.podiumItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.podiumAvatar, {
        borderColor: (rColor?.bg || '#888') + '80',
        shadowColor: rColor?.bg || '#888', shadowOpacity: 0.5, shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 }, elevation: 8,
      }]}>
        <Text style={styles.podiumAvatarText}>{(item.full_name || '?')[0].toUpperCase()}</Text>
        <View style={[styles.rankBadge, { backgroundColor: rColor?.bg || '#888' }]}>
          <Text style={styles.rankBadgeText}>{item.rank}</Text>
        </View>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {item.full_name?.split(' ')[0] || 'Kullanıcı'}
      </Text>
      <Text style={[styles.podiumCC, { color: rColor?.bg || '#888' }]}>
        {cc >= 1000 ? `${(cc / 1000).toFixed(1)}k` : cc.toFixed(0)} CC
      </Text>
      <View style={[styles.podiumBar, { height: h, backgroundColor: (rColor?.bg || '#888') + '22', borderColor: (rColor?.bg || '#888') + '44' }]}>
        <Text style={[styles.podiumPos, { color: rColor?.bg || '#888' }]}>{item.rank}</Text>
      </View>
    </Animated.View>
  );
}

function LeaderRow({ item, index }) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const cc = Number(item.cc_period || 0);
  const co2 = Number(item.co2_period || 0);

  return (
    <Animated.View
      style={[
        styles.leaderRow,
        item.isMe && styles.leaderRowMe,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {item.isMe && (
        <LinearGradient
          colors={['rgba(0,255,135,0.08)', 'transparent']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[styles.leaderRank, item.isMe && { color: colors.primary }]}>#{item.rank}</Text>
      <View style={[styles.leaderAvatar, item.isMe && { borderColor: colors.primary, backgroundColor: colors.primaryGlowSoft }]}>
        <Text style={[styles.leaderAvatarText, item.isMe && { color: colors.primary }]}>
          {(item.full_name || '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.leaderInfo}>
        <Text style={[styles.leaderName, item.isMe && { color: colors.primary }]}>
          {item.isMe ? 'Siz' : item.full_name}
        </Text>
        <Text style={styles.leaderCo2}>{Number(co2).toFixed(1)} kg CO2 tasarruf</Text>
      </View>
      <Text style={[styles.leaderCC, item.isMe && { color: colors.primary }]}>
        {cc.toLocaleString()} <Text style={{ fontSize: 10 }}>CC</Text>
      </Text>
    </Animated.View>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [period, setPeriod] = useState('week');
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodIdx, setPeriodIdx] = useState(0);

  const loadData = useCallback(async (p = period) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/community/leaderboard?period=${p}`);
      const list = (data.leaderboard || []).map((item, i) => ({
        ...item,
        rank: i + 1,
        isMe: item.id === user?.id,
      }));
      setLeaderboard(list);
      setMyRank(data.my_rank);
    } catch (e) {
      console.warn('leaderboard fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [period, user?.id]);

  useFocusEffect(useCallback(() => { loadData(period); }, [period]));

  const cycleFilter = () => {
    const next = (periodIdx + 1) % PERIODS.length;
    setPeriodIdx(next);
    setPeriod(PERIODS[next]);
  };

  const top3 = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const myEntry = leaderboard.find(r => r.isMe);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(0,255,135,0.05)', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: 180 }]}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={restOfList}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <View>
                  <Text style={styles.screenTitle}>Liderlik</Text>
                  <Text style={styles.screenSub}>{PERIOD_LABELS[period]} en iyiler</Text>
                </View>
                <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7} onPress={cycleFilter}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.filterText}>{PERIOD_LABELS[period]}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {myEntry && (
                <View style={styles.myRankCard}>
                  <LinearGradient
                    colors={['rgba(0,255,135,0.1)', 'rgba(0,255,135,0.04)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.myRankLeft}>
                    <View style={styles.myRankAvatarWrap}>
                      <View style={styles.myRankAvatar}>
                        <Ionicons name="person" size={20} color={colors.primary} />
                      </View>
                    </View>
                    <View>
                      <Text style={styles.myRankLabel}>Senin Sıran</Text>
                      <Text style={styles.myRankName}>{user?.full_name || 'Sen'}</Text>
                    </View>
                  </View>
                  <View style={styles.myRankRight}>
                    <Text style={styles.myRankNum}>#{myRank || myEntry.rank}</Text>
                    <Text style={styles.myRankCC}>{Number(myEntry.cc_period || 0).toLocaleString()} CC</Text>
                  </View>
                </View>
              )}

              {podiumOrder.length >= 3 && (
                <>
                  <Text style={styles.sectionLabel}>TOP 3</Text>
                  <View style={styles.podium}>
                    {podiumOrder.map((item, i) => (
                      <PodiumItem key={item.id} item={item} position={i + 1} />
                    ))}
                  </View>
                </>
              )}

              {restOfList.length > 0 && <Text style={styles.sectionLabel}>SIRALI LİSTE</Text>}
            </>
          }
          renderItem={({ item, index }) => <LeaderRow item={item} index={index} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            leaderboard.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="trophy-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>Bu dönem için henüz aktivite yok.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  screenTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  screenSub: { fontSize: 13, color: colors.textMuted, marginTop: 3, fontWeight: '600' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill,
  },
  filterText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },

  myRankCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 24,
    borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.primaryBorderStrong,
    padding: 16, overflow: 'hidden',
  },
  myRankLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  myRankAvatarWrap: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: colors.primary,
    padding: 2,
  },
  myRankAvatar: {
    flex: 1, borderRadius: 21,
    backgroundColor: colors.primaryGlowSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  myRankLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  myRankName: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 2 },
  myRankRight: { alignItems: 'flex-end' },
  myRankNum: { fontSize: 28, fontWeight: '900', color: colors.primary, lineHeight: 30 },
  myRankCC: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1.5, marginHorizontal: 20, marginBottom: 14,
  },

  podium: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    paddingHorizontal: 20, marginBottom: 28, gap: 8,
  },
  podiumItem: { flex: 1, alignItems: 'center', gap: 6 },
  podiumAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.backgroundCard, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  podiumAvatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  rankBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.background,
  },
  rankBadgeText: { fontSize: 10, fontWeight: '900', color: '#000' },
  podiumName: { fontSize: 11, fontWeight: '700', color: '#fff', textAlign: 'center' },
  podiumCC: { fontSize: 12, fontWeight: '800' },
  podiumBar: {
    width: '100%', borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 10, borderWidth: 1,
  },
  podiumPos: { fontSize: 18, fontWeight: '900' },

  listContent: { paddingHorizontal: 20 },
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.backgroundCard, borderRadius: radius.xl,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  leaderRowMe: { borderColor: colors.primaryBorder },
  leaderRank: { width: 28, fontSize: 14, fontWeight: '800', color: colors.textMuted, textAlign: 'center' },
  leaderAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.backgroundElevated, borderWidth: 1.5, borderColor: colors.borderMedium,
    alignItems: 'center', justifyContent: 'center',
  },
  leaderAvatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  leaderCo2: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  leaderCC: { fontSize: 16, fontWeight: '900', color: colors.gold },

  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
