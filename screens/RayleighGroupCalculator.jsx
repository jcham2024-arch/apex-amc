import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';

const TARGET_SIZE = 280;
const SCALE_INCHES = 6;
const PX_PER_INCH = TARGET_SIZE / SCALE_INCHES;

export default function RayleighGroupCalculator() {
  const [shots, setShots] = useState([
    { id: '1', x: -0.45, y: 0.62 },
    { id: '2', x: 0.35, y: 0.28 },
    { id: '3', x: -0.12, y: -0.55 },
  ]);

  const handleTargetTap = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const xInches = (locationX - TARGET_SIZE / 2) / PX_PER_INCH;
    const yInches = (TARGET_SIZE / 2 - locationY) / PX_PER_INCH;

    setShots([...shots, { id: Date.now().toString(), x: xInches, y: yInches }]);
  };

  const calculateMetrics = () => {
    const n = shots.length;
    if (n < 3) return null;

    const coiX = shots.reduce((sum, s) => sum + s.x, 0) / n;
    const coiY = shots.reduce((sum, s) => sum + s.y, 0) / n;

    const radii = shots.map((s) => Math.sqrt(Math.pow(s.x - coiX, 2) + Math.pow(s.y - coiY, 2)));
    const meanRadius = radii.reduce((sum, r) => sum + r, 0) / n;

    const sumSqRadii = radii.reduce((sum, r) => sum + r * r, 0);
    const sigma = Math.sqrt(sumSqRadii / (2 * n));

    return { n, coiX, coiY, meanRadius, cep50: 1.1774 * sigma, cep90: 2.1460 * sigma };
  };

  const metrics = calculateMetrics();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Rayleigh CEP Group Calculator</Text>

      <View style={styles.targetWrapper}>
        <TouchableOpacity activeOpacity={0.9} style={styles.targetCanvas} onPress={handleTargetTap}>
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />

          {shots.map((shot, idx) => {
            const pxX = TARGET_SIZE / 2 + shot.x * PX_PER_INCH - 6;
            const pxY = TARGET_SIZE / 2 - shot.y * PX_PER_INCH - 6;
            return (
              <View key={shot.id} style={[styles.shotDot, { left: pxX, top: pxY }]}>
                <Text style={styles.shotNumber}>{idx + 1}</Text>
              </View>
            );
          })}
        </TouchableOpacity>
      </View>

      {metrics && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CEP 50% RADIUS: {metrics.cep50.toFixed(2)}"</Text>
          <Text style={styles.cardTitle}>MEAN RADIUS: {metrics.meanRadius.toFixed(2)}"</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  header: { fontSize: 16, fontWeight: '900', color: '#10b981', marginBottom: 12 },
  targetWrapper: { alignItems: 'center', marginBottom: 16 },
  targetCanvas: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  crosshairH: { position: 'absolute', width: '100%', height: 1, backgroundColor: '#334155aa', top: TARGET_SIZE / 2 },
  crosshairV: { position: 'absolute', height: '100%', width: 1, backgroundColor: '#334155aa', left: TARGET_SIZE / 2 },
  shotDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justify.content: 'center',
  },
  shotNumber: { color: '#ffffff', fontSize: 7, fontWeight: '900' },
  card: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#38bdf8', fontSize: 14, fontWeight: '900', marginBottom: 4 },
});
