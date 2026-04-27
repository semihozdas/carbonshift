import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapComponent({ location, routeCoordinates }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Harita web sürümünde şu an kullanılamıyor.</Text>
      <Text style={styles.subtext}>Lütfen mobil uygulamayı (Expo Go) kullanın.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3C2B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtext: {
    color: '#74C69D',
    marginTop: 10,
    textAlign: 'center',
  }
});
