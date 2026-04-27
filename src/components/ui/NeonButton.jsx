import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows } from '../../theme/colors';

export default function NeonButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
  style,
}) {
  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.ghost, disabled && styles.disabledOutline, style]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.row}>
            {icon}
            <Text style={[styles.ghostText, icon && { marginLeft: 8 }]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, disabled && { opacity: 0.5 }, style]}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <View style={styles.row}>
            {icon}
            <Text style={[styles.text, icon && { marginLeft: 8 }]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    ...shadows.neonGreenSoft,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ghost: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryBorderStrong,
    backgroundColor: colors.primaryGlowSoft,
  },
  ghostText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabledOutline: { opacity: 0.5 },
});
