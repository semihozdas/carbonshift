import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/colors';

export default function StatCard({ label, value, icon, color = colors.primary, suffix }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
        {suffix ? <Text style={styles.suffix}>{' '}{suffix}</Text> : null}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  suffix: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  label: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
});
