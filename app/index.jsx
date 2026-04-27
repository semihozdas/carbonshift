import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/context/AuthContext';
import { colors, shadows } from '../src/theme/colors';

export default function Splash() {
  const router = useRouter();
  const { user, bootstrapping } = useAuth();

  const fade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(24)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(16)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. bg fade in
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      // 2. logo pops in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.timing(logoRotate, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(ringScale, { toValue: 1.4, useNativeDriver: true, tension: 40, friction: 8 }),
      ]),
      // 3. text slides up
      Animated.parallel([
        Animated.timing(textSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(textFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 4. tagline
      Animated.parallel([
        Animated.timing(taglineSlide, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(taglineFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    // pulsing ring loop
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringOpacity, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    }, 900);
  }, []);

  useEffect(() => {
    if (bootstrapping) return;
    const t = setTimeout(() => {
      router.replace(user ? '/(tabs)' : '/auth');
    }, 2200);
    return () => clearTimeout(t);
  }, [bootstrapping, user]);

  const logoRotateStr = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '0deg'] });

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <LinearGradient
        colors={[colors.background, '#070E1A', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient glow */}
      <LinearGradient
        colors={['rgba(0,255,135,0.14)', 'transparent']}
        style={styles.ambientGlow}
      />

      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          { transform: [{ scale: logoScale }, { rotate: logoRotateStr }] },
        ]}
      >
        <LinearGradient
          colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.logo, shadows.neonGreen]}
        >
          <Text style={styles.logoIcon}>♻</Text>
        </LinearGradient>
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: textFade, transform: [{ translateY: textSlide }], alignItems: 'center' }}>
        <View style={styles.titleRow}>
          <Text style={styles.titleWhite}>Carbon</Text>
          <Text style={styles.titleGreen}>Shift</Text>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineFade, transform: [{ translateY: taglineSlide }], marginTop: 10 }}>
        <View style={styles.taglineWrap}>
          <Text style={styles.tagline}>HER ADIMIN GÜCÜ VAR</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
  },
  pulseRing: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  logoWrap: { marginBottom: 28 },
  logo: {
    width: 96, height: 96, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  logoIcon: { fontSize: 56, color: '#000' },
  titleRow: { flexDirection: 'row' },
  titleWhite: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
  titleGreen: { fontSize: 44, fontWeight: '900', color: colors.primary, letterSpacing: -1.5 },
  taglineWrap: {
    borderWidth: 1, borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryGlowSoft,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99,
  },
  tagline: {
    color: colors.primary, fontSize: 11, letterSpacing: 3.5, fontWeight: '800',
  },
});
