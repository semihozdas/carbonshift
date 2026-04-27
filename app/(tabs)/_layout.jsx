import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../src/theme/colors';

function CenterButton() {
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.65, duration: 1100, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1100, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.7, duration: 1100, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.centerOuter}>
      <Animated.View
        style={[
          styles.pulseRing,
          { transform: [{ scale: pulse }], opacity: pulseOpacity },
        ]}
      />
      <View style={[styles.centerBtn, shadows.neonGreen]}>
        <Ionicons name="navigate" size={24} color="#000" />
      </View>
    </View>
  );
}

function TabIcon({ name, outlineName, color, focused }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.18 : 1,
      useNativeDriver: true,
      tension: 140,
      friction: 7,
    }).start();
  }, [focused]);

  return (
    <View style={styles.iconWrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={focused ? name : outlineName} size={22} color={color} />
      </Animated.View>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.32)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" outlineName="home-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Görevler',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="trophy" outlineName="trophy-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: '',
          tabBarLabelStyle: { display: 'none' },
          tabBarIcon: () => <CenterButton />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Topluluk',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="people" outlineName="people-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" outlineName="person-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(8,16,28,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,255,135,0.14)',
    height: 78,
    paddingTop: 6,
    paddingBottom: 16,
    paddingHorizontal: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    width: 46,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  centerOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  pulseRing: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  centerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
});
