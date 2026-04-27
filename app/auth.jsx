import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../src/theme/colors';
import { login as loginApi, register as registerApi } from '../src/services/authService';
import { useAuth } from '../src/context/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 2500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Eksik Alan', 'E-posta ve şifre gerekli.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Şifre Çok Kısa', 'En az 6 karakterli bir şifre belirle.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await loginApi(email.trim(), password);
      } else {
        await registerApi({ email: email.trim(), password, full_name: fullName.trim() });
      }
      await refreshUser();
      router.replace('/(tabs)');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Bir hata oluştu.';
      Alert.alert(isLogin ? 'Giriş Başarısız' : 'Kayıt Başarısız', msg);
    } finally {
      setLoading(false);
    }
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.2] });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <LinearGradient
        colors={[colors.background, '#070E1A']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.ambientTop, { opacity: glowOpacity }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.logoWrap, shadows.neonGreenSoft]}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <Text style={styles.logoIcon}>♻</Text>
            </LinearGradient>
          </View>
          <Text style={styles.appTitle}>
            Carbon<Text style={{ color: colors.primary }}>Shift</Text>
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Tekrar hoş geldin! Dünyayı korumaya devam et.'
              : 'Katıl, gezegeni birlikte değiştirelim.'}
          </Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {!isLogin && (
            <InputField
              icon="person-outline"
              placeholder="Ad Soyad"
              value={fullName}
              onChangeText={setFullName}
              focused={focusedField === 'name'}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
          )}
          <InputField
            icon="mail-outline"
            placeholder="E-posta adresi"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            focused={focusedField === 'email'}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
          <InputField
            icon="lock-closed-outline"
            placeholder="Şifre (en az 6 karakter)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            focused={focusedField === 'pass'}
            onFocus={() => setFocusedField('pass')}
            onBlur={() => setFocusedField(null)}
            rightEl={
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} activeOpacity={0.7}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          >
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <Text style={styles.submitText}>Lütfen bekle...</Text>
              ) : (
                <View style={styles.submitRow}>
                  <Text style={styles.submitText}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Switch */}
          <TouchableOpacity onPress={() => setIsLogin(p => !p)} style={styles.switchRow} activeOpacity={0.7}>
            <Text style={styles.switchText}>
              {isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
            </Text>
            <Text style={styles.switchLink}>
              {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Demo */}
        <TouchableOpacity
          style={styles.demoBtn}
          onPress={() => { setEmail('demo@carbonshift.local'); setPassword('demo123'); setIsLogin(true); }}
          activeOpacity={0.7}
        >
          <Ionicons name="flash" size={14} color={colors.primary} />
          <Text style={styles.demoText}>Demo hesapla dene</Text>
        </TouchableOpacity>

        {/* Features list */}
        <View style={styles.features}>
          {[
            { icon: 'leaf', text: 'Karbon ayak izini takip et' },
            { icon: 'trophy', text: 'Görev tamamla, CC kazan' },
            { icon: 'people', text: 'Toplulukla yarış' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={14} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({ icon, placeholder, rightEl, focused, onFocus, onBlur, ...props }) {
  return (
    <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
      <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
      {rightEl}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  ambientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: colors.primary,
  },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48, justifyContent: 'center' },

  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoWrap: { borderRadius: 26, marginBottom: 18 },
  logo: { width: 76, height: 76, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  logoIcon: { fontSize: 44, color: '#000' },
  appTitle: { fontSize: 34, color: '#fff', fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.xxl, padding: 20,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 16,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.xl, paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    gap: 10,
  },
  inputWrapFocused: { borderColor: colors.primaryBorderStrong, backgroundColor: 'rgba(0,255,135,0.04)' },
  input: { flex: 1, height: 50, color: '#fff', fontSize: 15 },

  submitBtn: { borderRadius: radius.pill, overflow: 'hidden', marginTop: 8, ...shadows.neonGreenSoft },
  submitGradient: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#000', letterSpacing: 0.3 },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  switchText: { fontSize: 13, color: colors.textSecondary },
  switchLink: { fontSize: 13, color: colors.primary, fontWeight: '800' },

  demoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, marginBottom: 28,
  },
  demoText: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  features: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryGlowSoft,
    borderWidth: 1, borderColor: colors.primaryBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
});
