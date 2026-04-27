import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CarbonScoreCard({ score, co2Saved }) {
  return (
    <LinearGradient colors={['#40916C', '#1A3C2B']} style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>CarbonCoin Bakiyesi</Text>
          <Text style={styles.value}>{score} CC</Text>
        </View>
        <View style={styles.divider} />
        <View>
          <Text style={styles.label}>CO2 Tasarrufu</Text>
          <Text style={styles.value}>{co2Saved} kg</Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '65%' }]} />
        </View>
        <Text style={styles.progressText}>Seviye 4 - Sonraki seviyeye 240 XP kaldı</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    color: '#D8F3DC',
    fontSize: 12,
    marginBottom: 5,
  },
  value: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#74C69D',
  },
  progressText: {
    color: '#D8F3DC',
    fontSize: 11,
    textAlign: 'center',
  }
});
