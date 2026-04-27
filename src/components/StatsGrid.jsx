import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatsGrid({ steps, distance, cc }) {
  const stats = [
    { label: 'Adım', value: steps, icon: 'walk', color: '#74C69D' },
    { label: 'Mesafe', value: `${distance} km`, icon: 'map', color: '#40916C' },
    { label: 'Kazanılan', value: `${cc} CC`, icon: 'leaf', color: '#D4A017' },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
            <Ionicons name={stat.icon} size={24} color={stat.color} />
          </View>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#14281d',
    borderRadius: 15,
    padding: 15,
    width: '31%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(116, 198, 157, 0.1)',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  value: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    color: '#95ad9e',
    fontSize: 12,
    marginTop: 2,
  }
});
