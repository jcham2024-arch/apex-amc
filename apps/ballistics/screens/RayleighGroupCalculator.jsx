/**
 * Rayleigh group / CEP calculator.
 *
 * SAFETY: the maths here now comes from `@apex/ballistics-core`, which is the
 * same validated code the website uses. It used to be reimplemented inline:
 *
 *   const sigma = Math.sqrt(sumSqRadii / (2 * n));
 *   return { cep50: 1.1774 * sigma, cep90: 2.1460 * sigma };
 *
 * The arithmetic happened to be right, but the constants were copy-pasted
 * literals. That is precisely the duplication the provenance system exists to
 * prevent, and it had already let one wrong Grubbs table survive in two places.
 * Now there is one CEP definition in the repo, and the test suite guards it.
 */
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { dispersion } from '@apex/ballistics-core';

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
    // Delegates to the shared domain. It returns null for fewer than 3 shots.
    return dispersion(shots);
  };

  // A Rayleigh CEP needs at least 3 shots to be meaningful. The shared domain
  // permits 2 (it can return an SD), so the stricter UI rule is kept here.
  const metrics = shots.length >= 3 ? calculateMetrics() : null;

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
          <Text style={styles.cardTitle}>CEP 90% RADIUS: {metrics.cep90.toFixed(2)}"</Text>
          <Text style={styles.cardTitle}>MEAN RADIUS: {metrics.meanRadius.toFixed(2)}"</Text>
          <Text style={styles.cardTitle}>EXTREME SPREAD: {metrics.extremeSpread.toFixed(2)}"</Text>
          <Text style={styles.cardSubtitle}>{metrics.n} shots</Text>
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
    justifyContent: 'center',
  },
  shotNumber: { color: '#ffffff', fontSize: 7, fontWeight: '900' },
  card: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#38bdf8', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  cardSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 6 },
});
