import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  TextInput, Alert, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapComponent from '../../components/MapComponent';
import { startTracking, stopTracking, isTracking } from '../../src/services/locationTracker';
import { loadBusStopsFromAPI, getBusStops, addBusStop, removeBusStop } from '../../src/services/busStops';
import { colors, shadows, radius } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';

const { width, height } = Dimensions.get('window');

const MODE_META = {
  walk:       { label: 'Yürüyüş',      icon: 'walk',     color: colors.primary,      desc: '< 8 km/s' },
  bike:       { label: 'Bisiklet',      icon: 'bicycle',  color: colors.gold,          desc: '8-25 km/s' },
  bus:        { label: 'Otobüs',        icon: 'bus',      color: colors.accentBlue,    desc: 'Durak yakını' },
  car:        { label: 'Araç',          icon: 'car',      color: colors.error,         desc: '> 25 km/s' },
  stationary: { label: 'Sabit',         icon: 'pause',    color: colors.textMuted,     desc: '—' },
};

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { notifyNewActivity } = useAuth();

  // Location state
  const [location, setLocation] = useState(null);
  const [busStops, setBusStops] = useState([]);

  // Tracking state
  const [tracking, setTracking] = useState(false);
  const [stats, setStats] = useState({
    distanceKm: 0, speedKmh: 0, avgSpeedKmh: 0,
    durationSec: 0, co2Saved: 0, ccEarned: 0,
    mode: 'stationary', dominantMode: 'walk', coords: [],
    stepCount: 0, busStopVisits: 0,
    currentMode: 'walk', pendingMode: null,
    distanceByMode: { walk: 0, bike: 0, bus: 0, car: 0 },
    segments: [],
  });
  const [lastResult, setLastResult] = useState(null);

  // Stops panel
  const [showStopsPanel, setShowStopsPanel] = useState(false);

  // Animations
  const statsAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const pulseLoop = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
    loadBusStopsFromAPI().then(setBusStops);
  }, []);

  // Animate stats panel in/out
  useEffect(() => {
    Animated.timing(statsAnim, {
      toValue: tracking ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();

    if (tracking) {
      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.55, duration: 900, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.6, duration: 900, useNativeDriver: true }),
          ]),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0.6);
    }
  }, [tracking]);

  const handleToggleTracking = async () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.88, useNativeDriver: true, tension: 200 }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 80 }),
    ]).start();

    if (!tracking) {
      try {
        setLastResult(null);
        await startTracking({
          onUpdate: (data) => setStats(data),
        });
        setTracking(true);
      } catch (e) {
        Alert.alert('Hata', e.message);
      }
    } else {
      const result = await stopTracking();
      setTracking(false);
      setStats(s => ({ ...s, coords: s.coords }));
      if (result) {
        setLastResult(result);
        Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 60 }).start();
        if (result.submitted) {
          // Refresh CC balance + notify all screens (home, profile, tasks)
          notifyNewActivity(result.activity).catch(() => {});
        }
      }
    }
  };



  const handleGoToLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    const coords = loc.coords;
    setLocation(coords);
    mapRef.current?.animateToRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    }, 1000);
  };

  const handleRemoveStop = async (id) => {
    await removeBusStop(id);
    setBusStops(getBusStops());
  };



  const dismissResult = () => {
    Animated.timing(resultAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setLastResult(null));
  };

  const currentMode = stats.dominantMode || 'walk';
  const meta = MODE_META[currentMode] || MODE_META.walk;
  const liveMeta = MODE_META[stats.mode] || meta;

  const statsSlide = statsAnim.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] });
  const statsOpacity = statsAnim;

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapComponent
        ref={mapRef}
        location={location}
        routeCoordinates={stats.coords}
        busStops={busStops}
        dominantMode={currentMode}
      />


      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + 10 }]}>
        <LinearGradient
          colors={['rgba(6,11,20,0.92)', 'rgba(6,11,20,0.78)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topLeft}>
          <Text style={styles.topTitle}>
            Carbon<Text style={{ color: colors.primary }}>Shift</Text>
          </Text>
          {tracking && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>CANLI</Text>
            </View>
          )}
        </View>
        <View style={styles.topRight}>
          {/* Stops panel button */}
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => setShowStopsPanel(p => !p)}
            activeOpacity={0.7}
          >
            <Ionicons name="bus" size={16} color={showStopsPanel ? colors.accentBlue : colors.textSecondary} />
            {busStops.length > 0 && (
              <View style={styles.topBtnBadge}>
                <Text style={styles.topBtnBadgeText}>{busStops.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Go to location button */}
          <TouchableOpacity
            style={styles.topBtn}
            onPress={handleGoToLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="locate" size={18} color={colors.primary} />
          </TouchableOpacity>

        </View>
      </View>

      {/* Bus stops panel */}
      {showStopsPanel && (
        <View style={[styles.stopsPanel, { top: insets.top + 66 }]}>
          <LinearGradient
            colors={['rgba(6,11,20,0.97)', 'rgba(6,11,20,0.95)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.stopsPanelTitle}>Otobüs Durakları ({busStops.length})</Text>
          <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
            {busStops.length === 0 ? (
              <Text style={styles.emptyText}>Henüz durak eklenmedi.</Text>
            ) : busStops.map(stop => (
              <View key={stop.id} style={styles.stopRow}>
                <Ionicons name="bus" size={14} color={colors.accentBlue} />
                <Text style={styles.stopRowName} numberOfLines={1}>{stop.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveStop(stop.id)} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Live mode breakdown (shown when >1 mode active) */}
      {tracking && (() => {
        const dbm = stats.distanceByMode || {};
        const activeModes = ['walk', 'bike', 'bus', 'car'].filter(m => (dbm[m] || 0) > 0.01);
        if (activeModes.length < 2) return null;
        return (
          <View style={[styles.breakdownPanel, { bottom: 296 + insets.bottom }]}>
            <LinearGradient
              colors={['rgba(6,11,20,0.95)', 'rgba(6,11,20,0.9)']}
              style={StyleSheet.absoluteFill}
            />
            {activeModes.map((m, i) => {
              const meta = MODE_META[m];
              const isCurrent = stats.currentMode === m;
              return (
                <React.Fragment key={m}>
                  {i > 0 && <View style={styles.breakdownDivider} />}
                  <View style={styles.breakdownItem}>
                    <Ionicons
                      name={meta.icon}
                      size={13}
                      color={isCurrent ? meta.color : meta.color + 'AA'}
                    />
                    <Text style={[
                      styles.breakdownVal,
                      { color: isCurrent ? '#fff' : '#fff' + 'CC' },
                    ]}>
                      {dbm[m].toFixed(2)}
                    </Text>
                    <Text style={styles.breakdownLbl}>km</Text>
                  </View>
                </React.Fragment>
              );
            })}
            {stats.pendingMode && stats.pendingMode !== stats.currentMode && (
              <>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownPending}>
                  <Ionicons name="sync" size={11} color={colors.gold} />
                  <Text style={styles.breakdownPendingText}>
                    {MODE_META[stats.pendingMode]?.label}…
                  </Text>
                </View>
              </>
            )}
          </View>
        );
      })()}

      {/* Live stats panel (slides up when tracking) */}
      <Animated.View
        style={[
          styles.statsPanel,
          { bottom: 220 + insets.bottom, opacity: statsOpacity, transform: [{ translateY: statsSlide }] },
        ]}
      >
        <LinearGradient
          colors={['rgba(6,11,20,0.95)', 'rgba(6,11,20,0.9)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.statItem}>
          <Ionicons name="trail-sign" size={14} color={colors.primary} />
          <Text style={styles.statVal}>{stats.distanceKm.toFixed(2)}</Text>
          <Text style={styles.statLbl}>km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="speedometer" size={14} color={colors.accentBlue} />
          <Text style={styles.statVal}>{Math.round(stats.speedKmh)}</Text>
          <Text style={styles.statLbl}>km/s</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="footsteps" size={14} color={colors.primary} />
          <Text style={styles.statVal}>{(stats.stepCount || 0).toLocaleString()}</Text>
          <Text style={styles.statLbl}>adım</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="bus" size={14} color={colors.accentBlue} />
          <Text style={[styles.statVal, stats.busStopVisits >= 2 && { color: colors.accentBlue }]}>
            {stats.busStopVisits || 0}/2
          </Text>
          <Text style={styles.statLbl}>durak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="timer" size={14} color={colors.gold} />
          <Text style={styles.statVal}>{formatTime(stats.durationSec)}</Text>
          <Text style={styles.statLbl}>süre</Text>
        </View>
      </Animated.View>



      {/* Trip result card */}
      {lastResult && !tracking && (
        <Animated.View
          style={[styles.resultCard, {
            bottom: 220 + insets.bottom,
            opacity: resultAnim,
            transform: [{ scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
          }]}
        >
          <LinearGradient
            colors={['rgba(0,255,135,0.10)', 'rgba(6,11,20,0.98)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.resultHeader}>
            <View style={[styles.resultModeIcon, { backgroundColor: (MODE_META[lastResult.mode]?.color || colors.primary) + '20' }]}>
              <Ionicons name={MODE_META[lastResult.mode]?.icon || 'walk'} size={20} color={MODE_META[lastResult.mode]?.color || colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>Seyahat Tamamlandı!</Text>
              <Text style={styles.resultSub}>{MODE_META[lastResult.mode]?.label} · {formatTime(lastResult.duration_sec)}</Text>
            </View>
            <TouchableOpacity onPress={dismissResult} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.resultStats}>
            {[
              { label: 'Mesafe', val: `${lastResult.distance_km.toFixed(2)} km`, color: colors.primary },
              { label: 'CO2 Tasarruf', val: `${lastResult.co2_saved_g} g`, color: colors.success },
              { label: 'Kazanılan CC', val: lastResult.cc_earned >= 0 ? `+${lastResult.cc_earned.toFixed(1)}` : lastResult.cc_earned.toFixed(1), color: lastResult.cc_earned < 0 ? colors.error : colors.gold },
              ...(lastResult.step_count > 0 ? [{ label: 'Adım', val: lastResult.step_count.toLocaleString(), color: colors.primary }] : []),
            ].map((s, i) => (
              <View key={i} style={styles.resultStat}>
                <Text style={[styles.resultStatVal, { color: s.color }]}>{s.val}</Text>
                <Text style={styles.resultStatLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Trip composition — per-mode breakdown */}
          {(() => {
            const dbm = lastResult.distanceByMode || {};
            const total = (dbm.walk || 0) + (dbm.bike || 0) + (dbm.bus || 0) + (dbm.car || 0);
            const activeModes = ['walk', 'bike', 'bus', 'car']
              .map(m => ({ mode: m, km: dbm[m] || 0 }))
              .filter(x => x.km > 0.01);
            if (activeModes.length < 2 || total <= 0) return null;
            return (
              <View style={styles.composition}>
                <Text style={styles.compositionTitle}>YOLCULUK DETAYI</Text>
                <View style={styles.compositionBar}>
                  {activeModes.map((x, i) => (
                    <View
                      key={x.mode}
                      style={{
                        flex: x.km / total,
                        height: '100%',
                        backgroundColor: MODE_META[x.mode].color,
                        borderTopLeftRadius: i === 0 ? 4 : 0,
                        borderBottomLeftRadius: i === 0 ? 4 : 0,
                        borderTopRightRadius: i === activeModes.length - 1 ? 4 : 0,
                        borderBottomRightRadius: i === activeModes.length - 1 ? 4 : 0,
                      }}
                    />
                  ))}
                </View>
                <View style={styles.compositionList}>
                  {activeModes.map(x => {
                    const meta = MODE_META[x.mode];
                    const pct = Math.round((x.km / total) * 100);
                    return (
                      <View key={x.mode} style={styles.compositionRow}>
                        <View style={styles.compositionRowLeft}>
                          <Ionicons name={meta.icon} size={13} color={meta.color} />
                          <Text style={styles.compositionLabel}>{meta.label}</Text>
                        </View>
                        <Text style={styles.compositionKm}>
                          {x.km.toFixed(2)} km · {pct}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}
          {lastResult.tooShort ? (
            <Text style={styles.tooShortText}>
              Mesafe çok kısa (min. 50m). Puan kazanılmadı.
            </Text>
          ) : (
            <View style={[styles.savedBadge, { backgroundColor: lastResult.submitted ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', borderColor: lastResult.submitted ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)' }]}>
              <Ionicons name={lastResult.submitted ? 'checkmark-circle' : 'cloud-offline-outline'} size={14} color={lastResult.submitted ? '#22C55E' : '#F59E0B'} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: lastResult.submitted ? '#22C55E' : '#F59E0B' }}>
                {lastResult.submitted ? 'Sunucuya kaydedildi • Puanlar güncellendi' : 'Çevrimdışı kaydedildi • Sunucuya ulaşılamadı'}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Bottom control panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 96 }]}>
        <LinearGradient
          colors={['rgba(6,11,20,0)', 'rgba(6,11,20,0.97)', '#060B14']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
        />

        {/* Mode info row */}
        <View style={styles.modeRow}>
          {/* Auto-detected mode badge */}
          <View style={[styles.modeBadge, {
            backgroundColor: liveMeta.color + '18',
            borderColor: liveMeta.color + '50',
          }]}>
            <Ionicons name={liveMeta.icon} size={16} color={liveMeta.color} />
            <Text style={[styles.modeLabel, { color: liveMeta.color }]}>
              {tracking ? liveMeta.label : 'Otomatik Tespit'}
            </Text>
            {tracking && (
              <Text style={styles.modeDesc}>{liveMeta.desc}</Text>
            )}
          </View>

          {/* Mode legend when idle */}
          {!tracking && (
            <View style={styles.modeLegend}>
              {Object.entries(MODE_META).filter(([k]) => k !== 'stationary').map(([key, m]) => (
                <View key={key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                  <Text style={styles.legendText}>{m.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Track button row */}
        <View style={styles.trackRow}>
          <View style={styles.trackBtnWrap}>
            {tracking && (
              <Animated.View style={[
                styles.pulseRing,
                {
                  borderColor: colors.error,
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseOpacity,
                },
              ]} />
            )}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                onPress={handleToggleTracking}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={tracking
                    ? ['#EF4444', '#DC2626']
                    : [colors.primaryLight, colors.primary]
                  }
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[
                    styles.trackBtn,
                    tracking ? styles.trackBtnStop : styles.trackBtnStart,
                  ]}
                >
                  <Ionicons
                    name={tracking ? 'stop' : 'play'}
                    size={30}
                    color={tracking ? '#fff' : '#000'}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>
              {tracking ? 'Takip Ediliyor' : 'Seyahat Takibi'}
            </Text>
            <Text style={styles.trackSub}>
              {tracking
                ? `${stats.distanceKm.toFixed(2)} km · ${formatTime(stats.durationSec)}`
                : 'Taşıma modu otomatik tespit edilir'}
            </Text>
            {tracking && (
              <View style={styles.ccPreview}>
                <Ionicons name="star" size={11} color={colors.gold} />
                <Text style={styles.ccPreviewText}>+{stats.ccEarned.toFixed(1)} CC</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060B14' },


  // Top bar
  topBar: {
    position: 'absolute', left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', zIndex: 10,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error, shadowColor: colors.error, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  liveText: { fontSize: 10, fontWeight: '800', color: colors.error, letterSpacing: 1 },
  topRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  topBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  topBtnBadge: {
    position: 'absolute', top: -3, right: -3,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.accentBlue,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#060B14',
  },
  topBtnBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Stops panel
  stopsPanel: {
    position: 'absolute', left: 12, right: 12,
    borderRadius: radius.xl, padding: 14,
    borderWidth: 1, borderColor: colors.accentBlue + '40',
    overflow: 'hidden', zIndex: 9,
  },
  stopsPanelTitle: { fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 10 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  stopRowName: { flex: 1, fontSize: 13, color: '#fff', fontWeight: '500' },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },

  // Live stats panel
  statsPanel: {
    position: 'absolute', left: 12, right: 12,
    flexDirection: 'row',
    borderRadius: radius.xl, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.primaryBorder, overflow: 'hidden',
    zIndex: 8,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLbl: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 6 },


  // Live mode breakdown (above stats panel when >1 mode used)
  breakdownPanel: {
    position: 'absolute', left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.xl, paddingVertical: 10, paddingHorizontal: 4,
    borderWidth: 1, borderColor: colors.gold + '40', overflow: 'hidden',
    zIndex: 8,
  },
  breakdownItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4,
  },
  breakdownVal: { fontSize: 13, fontWeight: '800' },
  breakdownLbl: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  breakdownDivider: { width: 1, height: 18, backgroundColor: colors.border },
  breakdownPending: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8,
  },
  breakdownPendingText: {
    fontSize: 11, fontWeight: '700', color: colors.gold,
  },

  // Trip composition (in result card)
  composition: { marginTop: 14 },
  compositionTitle: {
    fontSize: 10, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1.2, marginBottom: 8,
  },
  compositionBar: {
    flexDirection: 'row', height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
    marginBottom: 10,
  },
  compositionList: { gap: 6 },
  compositionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  compositionRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compositionLabel: { fontSize: 12, color: '#fff', fontWeight: '600' },
  compositionKm: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  // Result card
  resultCard: {
    position: 'absolute', left: 12, right: 12,
    borderRadius: radius.xxl, padding: 16,
    borderWidth: 1, borderColor: colors.primaryBorder,
    overflow: 'hidden', zIndex: 8,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  resultModeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  resultSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  resultStats: { flexDirection: 'row', justifyContent: 'space-around' },
  resultStat: { alignItems: 'center', gap: 4 },
  resultStatVal: { fontSize: 20, fontWeight: '900' },
  resultStatLbl: { fontSize: 11, color: colors.textMuted },
  tooShortText: { fontSize: 11, color: colors.warning || '#F59E0B', textAlign: 'center', marginTop: 10, fontWeight: '600' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },

  // Bottom panel
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 40, paddingHorizontal: 20, zIndex: 5,
  },

  modeRow: { marginBottom: 16 },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1.5, alignSelf: 'flex-start', marginBottom: 10,
  },
  modeLabel: { fontSize: 14, fontWeight: '800' },
  modeDesc: { fontSize: 11, color: colors.textMuted, marginLeft: 4 },
  modeLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  trackBtnWrap: { alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, backgroundColor: 'transparent',
  },
  trackBtn: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
  },
  trackBtnStart: { ...shadows.neonGreen },
  trackBtnStop: {
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 16, elevation: 12,
  },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  trackSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  ccPreview: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ccPreviewText: { fontSize: 13, fontWeight: '800', color: colors.gold },
});
