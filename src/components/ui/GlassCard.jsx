import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../../theme/colors';

export default function GlassCard({ children, style, padded = true, strong = false }) {
  return (
    <View
      style={[
        strong ? styles.cardStrong : styles.card,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgGlass,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  cardStrong: {
    backgroundColor: colors.bgGlassStrong,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  padded: { padding: 18 },
});
