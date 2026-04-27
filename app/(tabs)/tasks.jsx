import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors, shadows, radius } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'daily', label: 'Günlük' },
  { key: 'weekly', label: 'Haftalık' },
  { key: 'monthly', label: 'Aylık' },
];

const REQ_UNIT = {
  distance_km: 'km',
  step_count: 'adım',
  trip_count: 'kez',
  walk_km: 'km',
  bus_km: 'km',
  bike_km: 'km',
  co2_saved: 'kg CO2',
};

const ICON_COLOR = {
  walk: colors.primary,
  bus: colors.accentBlue,
  bicycle: colors.gold,
  bike: colors.gold,
  'trash-bin': colors.accentPurple,
  leaf: '#22C55E',
  navigate: colors.accentCyan,
  star: colors.gold,
  footsteps: colors.primary,
  flame: '#F59E0B',
};

function getIconColor(icon, type) {
  if (ICON_COLOR[icon]) return ICON_COLOR[icon];
  if (type === 'daily') return colors.primary;
  if (type === 'weekly') return colors.accentBlue;
  return colors.gold;
}

function TaskCard({ task, onClaim }) {
  const pct = task.requirement_value > 0
    ? Math.min(1, (task.progress || 0) / task.requirement_value)
    : 0;
  const barAnim = useRef(new Animated.Value(0)).current;
  const color = getIconColor(task.icon, task.type);
  const unit = REQ_UNIT[task.requirement_type] || '';

  useEffect(() => {
    Animated.timing(barAnim, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, [pct]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const canClaim = task.is_completed && !task.is_claimed;
  const claimed = task.is_claimed;

  return (
    <View style={[styles.taskCard, claimed && styles.taskCardClaimed]}>
      <LinearGradient
        colors={[color + '0A', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.taskRow}>
        <View style={[styles.taskIconWrap, { backgroundColor: color + '1A', borderColor: color + '30' }]}>
          <Ionicons name={task.icon || 'star'} size={22} color={claimed ? colors.textMuted : color} />
        </View>
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, claimed && styles.textMuted]}>{task.title}</Text>
          <Text style={styles.taskDesc}>{task.description}</Text>
          <View style={styles.taskMeta}>
            <Text style={[styles.taskProgress, claimed && styles.textMuted]}>
              {Number(task.progress || 0).toFixed(task.requirement_type === 'distance_km' || task.requirement_type?.includes('km') ? 1 : 0)}
              {' / '}
              {Number(task.requirement_value || 0).toFixed(task.requirement_type === 'distance_km' || task.requirement_type?.includes('km') ? 1 : 0)}
              {' '}{unit}
            </Text>
          </View>
        </View>
        <View style={styles.taskRight}>
          <View style={[styles.rewardBadge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
            <Ionicons name="star" size={11} color={color} />
            <Text style={[styles.rewardText, { color }]}>{task.cc_reward} CC</Text>
          </View>
          {canClaim ? (
            <TouchableOpacity
              style={[styles.claimBtn, { backgroundColor: color, shadowColor: color, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 }]}
              onPress={() => onClaim(task)}
              activeOpacity={0.8}
            >
              <Text style={styles.claimBtnText}>Al!</Text>
            </TouchableOpacity>
          ) : claimed ? (
            <View style={styles.claimedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: barWidth, backgroundColor: claimed ? colors.textMuted : color }]} />
      </View>
      <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [tasks, setTasks] = useState({ daily: [], weekly: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks');
      const grouped = { daily: [], weekly: [], monthly: [] };
      for (const t of data) {
        if (grouped[t.type]) grouped[t.type].push(t);
      }
      setTasks(grouped);
    } catch (e) {
      console.warn('tasks fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTasks(); }, [loadTasks]));

  const handleTabChange = (key) => {
    const idx = TABS.findIndex(t => t.key === key);
    Animated.spring(tabAnim, { toValue: idx, useNativeDriver: true, tension: 120, friction: 10 }).start();
    setActiveTab(key);
  };

  const handleClaim = async (task) => {
    try {
      const { data } = await api.post(`/tasks/${task.id}/claim`);
      Alert.alert(
        'Ödül Kazanıldı!',
        `+${data.cc_earned} CC ve +${data.xp_earned} XP kazandın!`,
        [{ text: 'Harika!', onPress: () => { loadTasks(); refreshUser(); } }]
      );
    } catch (e) {
      const msg = e.response?.data?.error || 'Bir hata oluştu';
      Alert.alert('Hata', msg);
    }
  };

  const currentTasks = tasks[activeTab] || [];
  const tabWidth = (width - 40) / TABS.length;
  const tabTranslate = tabAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  const completedCount = currentTasks.filter(t => t.is_claimed).length;
  const activeCount = currentTasks.filter(t => !t.is_claimed).length;

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={['rgba(0,255,135,0.04)', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Görevler</Text>
            <Text style={styles.screenSub}>
              {activeCount} aktif · {completedCount} tamamlandı
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="trophy" size={16} color={colors.gold} />
            <Text style={styles.headerBadgeText}>{currentTasks.reduce((s, t) => s + (t.is_claimed ? 0 : t.cc_reward), 0)} CC bekliyor</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <Animated.View style={[styles.tabIndicator, { width: tabWidth - 8, transform: [{ translateX: tabTranslate }] }]} />
          {TABS.map((tab, i) => {
            const active = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {tasks[tab.key]?.some(t => t.is_completed && !t.is_claimed) && (
                  <View style={styles.tabDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : currentTasks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="trophy-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Bu dönem için görev tanımlanmamış.</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {currentTasks.map(task => (
              <TaskCard key={task.id} task={task} onClaim={handleClaim} />
            ))}
          </View>
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
  screenTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  screenSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '800', color: colors.gold },

  tabContainer: {
    flexDirection: 'row', backgroundColor: colors.backgroundCard,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: 4, marginBottom: 24, position: 'relative',
  },
  tabIndicator: {
    position: 'absolute', top: 4, left: 4, bottom: 4,
    backgroundColor: colors.primaryGlowSoft,
    borderRadius: radius.lg, marginLeft: 4,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, flexDirection: 'row', gap: 6 },
  tabLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabLabelActive: { color: colors.primary },
  tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },

  taskList: { gap: 12 },
  taskCard: {
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: 16, overflow: 'hidden', backgroundColor: colors.backgroundCard,
  },
  taskCardClaimed: { opacity: 0.55 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  taskIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 3 },
  taskDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  taskProgress: { fontSize: 12, fontWeight: '700', color: '#fff' },
  textMuted: { color: colors.textMuted },
  taskRight: { alignItems: 'flex-end', gap: 8 },
  rewardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1,
  },
  rewardText: { fontSize: 12, fontWeight: '800' },
  claimBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  claimBtnText: { fontSize: 13, fontWeight: '900', color: '#000' },
  claimedBadge: { padding: 4 },

  progressTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2, overflow: 'hidden', marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressPct: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textAlign: 'right' },

  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 60, backgroundColor: colors.backgroundCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
