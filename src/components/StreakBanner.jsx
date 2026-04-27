import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StreakBanner({ count }) {
  return (
    <View style={styles.banner}>
      <Ionicons name="flame" size={24} color="#E07B39" />
      <Text style={styles.text}>{count} Günlük Seri! Pes etme, dünyayı kurtarıyorsun.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(224, 123, 57, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(224, 123, 57, 0.3)',
  },
  text: {
    color: '#E07B39',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 13,
  }
});
