import React, { forwardRef, memo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { UrlTile, Polyline, Marker, Circle } from 'react-native-maps';
import { colors } from '../src/theme/colors';

const MODE_COLORS = {
  walk: colors.primary,
  bike: colors.gold,
  bus: colors.accentBlue,
  car: colors.error,
  stationary: colors.textMuted,
};

// Optimized Bus Stop Marker component
const BusStopMarker = memo(({ stop }) => (
  <React.Fragment>
    <Circle
      center={{ latitude: stop.latitude, longitude: stop.longitude }}
      radius={60}
      fillColor="rgba(59,130,246,0.12)"
      strokeColor="rgba(59,130,246,0.5)"
      strokeWidth={1.5}
      zIndex={1}
    />
    <Marker
      coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={2}
      tracksViewChanges={false} // Performance optimization
    >
      <View style={styles.stopMarker}>
        <Text style={styles.stopIcon}>🚌</Text>
      </View>
    </Marker>
  </React.Fragment>
));

const MapComponent = forwardRef(({
  location,
  routeCoordinates = [],
  busStops = [],
  dominantMode = 'walk',
}, ref) => {
  const region = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }
    : {
        latitude: 41.0082,
        longitude: 28.9784,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  const routeColor = MODE_COLORS[dominantMode] || colors.primary;

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      mapType="none"
      initialRegion={region}
      showsUserLocation={true}
      showsMyLocationButton={false}
      followsUserLocation={false}
      rotateEnabled={true}
      pitchEnabled={false}
      loadingEnabled={true}
      loadingIndicatorColor={colors.primary}
      loadingBackgroundColor="#F8F9FA"
    >
      <UrlTile
        urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
        shouldReplaceMapContent={true}
        tileCachePath="carbonshift_tiles"
        tileCacheMaxAge={604800} // 7 days
      />

      {/* Optimized Bus stops */}
      {busStops.map((stop) => (
        <BusStopMarker key={stop.id} stop={stop} />
      ))}

      {/* Route polyline */}
      {routeCoordinates.length > 1 && (
        <Polyline
          coordinates={routeCoordinates.map((c) => ({
            latitude: c.latitude,
            longitude: c.longitude,
          }))}
          strokeColor={routeColor}
          strokeWidth={5}
          lineJoin="round"
          lineCap="round"
          zIndex={3}
          tappable={false}
        />
      )}

      {/* Route start marker */}
      {routeCoordinates.length > 0 && (
        <Marker
          coordinate={{
            latitude: routeCoordinates[0].latitude,
            longitude: routeCoordinates[0].longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={4}
          tracksViewChanges={false}
        >
          <View style={[styles.startDot, { backgroundColor: routeColor }]} />
        </Marker>
      )}
    </MapView>
  );
});

export default memo(MapComponent);

const styles = StyleSheet.create({
  stopMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  stopIcon: { fontSize: 14 },
  startDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    shadowOpacity: 0.7,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  pendingMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIcon: { fontSize: 36 },
});
