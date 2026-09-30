import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

const TARGET_SIZE = 280; // Target Canvas Dimensions (px)
const SCALE_INCHES = 6;  // Total target width in inches (-3" to +3")
const PX_PER_INCH = TARGET_SIZE / SCALE_INCHES;

export default function RayleighGroupCalculator() {
  const [shots, setShots] = useState([
    { id: '1', x: -0.45, y: 0.62 },
    { id: '2', x: 0.35, y: 0.28 },
    { id: '3', x: -0.12, y: -0.55 },
    { id: '4', x: 0.50, y: -0.20 },
    { id: '5', x: -0.28, y: 0.15 },
  ]);

  const [distanceYards, setDistanceYards] = useState(100);

  // Tap handler to add shots directly onto target face
  const handleTargetTap = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    
    // Convert canvas pixels to relative inches centered at (0,0)
    const xInches = (locationX - TARGET_SIZE / 2) / PX_PER_INCH;
    const yInches = (TARGET_SIZE / 2 - locationY) / PX_PER_INCH; // Flip Y for standard Cartesian

    setShots([
      ...shots,
      { id: Date.now().toString(), x: xInches, y: yInches },
    ]);
  };

  const clearShots = () => setShots([]);
  const removeLastShot = () => setShots(shots.slice(0, -1));

  // Compute Rayleigh Group Metrics
  const calculateMetrics = () => {
    const n = shots.length;
    if (n < 3) return null;

    // 1. Center of Impact (COI)
    const coiX = shots.reduce((sum, s) => sum + s.x, 0) / n;
    const coiY = shots.reduce((sum, s) => sum + s.y, 0) / n;

    // 2. Radial distances from COI
    const radii = shots.map((s) =>
      Math.sqrt(Math.pow(s.x - coiX, 2) + Math.pow(s.y - coiY, 2))
    );
    const meanRadius = radii.reduce((sum, r) => sum + r, 0) / n;

    // 3. Extreme Spread (Max distance between any two shots)
    let extremeSpread = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = Math.sqrt(
          Math.pow(shots[i].x - shots[j].x, 2) +
          Math.pow(shots[i].y - shots[j].y, 2)
        );
        if (d > extremeSpread) extremeSpread = d;
      }
    }

    // 4. Rayleigh Parameter (Sigma)
    const sumSqRadii = radii.reduce((sum, r) => sum + r * r, 0);
    const sigma = Math.sqrt(sumSqRadii / (2 * n));

    // 5. CEP Radii
    const cep50 = 1.1774 * sigma;
    const cep90 = 2.1460 * sigma;

    // 1 MOA in inches at user distance = 1.047 * (distance / 100)
    const moaInches = 1.047 * (distanceYards / 100);

    return {
      n,
      coiX,
      coiY,
      meanRadius,
      extremeSpread,
      extremeSpreadMOA: extremeSpread / moaInches,
      sigma,
      cep50,
      cep50MOA: cep50 / moaInches,
      cep90,
      cep90MOA: cep90 / moaInches,
    };
  };

  const metrics = calculateMetrics();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Rayleigh CEP Group Calculator</Text>
      <Text style={styles.sub}>
        Tap target face to log shot impacts. Minimum 3 shots required for statistical estimation.
      </Text>

      {/* Interactive Target Canvas */}
      <View style={styles.targetWrapper}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.targetCanvas}
          onPress={handleTargetTap}
        >
          {/* Target Grid Rings */}
          <View style={[styles.ring, { width: PX_PER_INCH * 4, height: PX_PER_INCH * 4 }]} />
          <View style={[styles.ring, { width: PX_PER_INCH * 2, height: PX_PER_INCH * 2 }]} />
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />

          {/* Render CEP 50% Overlay Ring if metrics available */}
          {metrics && (
            <View
              style={[
                styles.cepRing,
                {
                  width: metrics.cep50 * 2 * PX_PER_INCH,
                  height: metrics.cep50 * 2 * PX_PER_INCH,
                  borderRadius: metrics.cep50 * PX_PER_INCH,
                  left: TARGET_SIZE / 2 + metrics.coiX * PX_PER_INCH - metrics.cep50 * PX_PER_INCH,
                  top: TARGET_SIZE / 2 - metrics.coiY * PX_PER_INCH - metrics.cep50 * PX_PER_INCH,
                },
              ]}
            />
          )}

          {/* Render Shot Dots */}
          {shots.map((shot, idx) => {
            const pxX = TARGET_SIZE / 2 + shot.x * PX_PER_INCH - 6;
            const pxY = TARGET_SIZE / 2 - shot.y * PX_PER_INCH - 6;
            return (
              <View key={shot.id} style={[styles.shotDot, { left: pxX, top: pxY }]}>
                <Text style={styles.shotNumber}>{idx + 1}</Text>
              </View>
            );
          })}

          {/* Render Center of Impact (COI) Marker */}
          {metrics && (
            <View
              style={[
                styles.coiMarker,
                {
                  left: TARGET_SIZE / 2 + metrics.coiX * PX_PER_INCH - 5,
                  top: TARGET_SIZE / 2 - metrics.coiY * PX_PER_INCH - 5,
                },
              ]}
            />
          )}
        </TouchableOpacity>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={removeLastShot}>
            <Text style={styles.secondaryBtnText}>Undo Shot</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={clearShots}>
            <Text style={styles.dangerBtnText}>Reset Target</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistical Results Engine */}
      {metrics ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>RAYLEIGH GROUP METRICS ({metrics.n} SHOTS)</Text>

          <View style={styles.metricGrid}>
            {/* CEP 50% Metric */}
            <View style={styles.gridItem}>
              <Text style={styles.metricLabel}>CEP 50% RADIUS</Text>
              <Text style={styles.metricHighlight}>
                {metrics.cep50.toFixed(2)}"
              </Text>
              <Text style={styles.metricSub}>
                {metrics.cep50MOA.toFixed(2)} MOA @ {distanceYards}yd
              </Text>
            </View>

            {/* CEP 90% Metric */}
            <View style={styles.gridItem}>
              <Text style={styles.metricLabel}>CEP 90% RADIUS</Text>
              <Text style={styles.metricValue}>
                {metrics.cep90.toFixed(2)}"
              </Text>
              <Text style={styles.metricSub}>
                {metrics.cep90MOA.toFixed(2)} MOA
              </Text>
            </View>

            {/* Mean Radius */}
            <View style={styles.gridItem}>
              <Text style={styles.metricLabel}>MEAN RADIUS (MR)</Text>
              <Text style={styles.metricValue}>
                {metrics.meanRadius.toFixed(2)}"
              </Text>
            </View>

            {/* Traditional Extreme Spread */}
            <View style={styles.gridItem}>
              <Text style={styles.metricLabel}>EXTREME SPREAD (ES)</Text>
              <Text style={styles.metricValue}>
                {metrics.extremeSpread.toFixed(2)}"
              </Text>
              <Text style={styles.metricSub}>
                {metrics.extremeSpreadMOA.toFixed(2)} MOA
              </Text>
            </View>
          </View>

          {/* Center of Impact (COI) Offsets */}
          <View style={styles.coiBox}>
            <Text style={styles.coiTitle}>CENTER OF IMPACT (COI) OFFSET</Text>
            <Text style={styles.coiText}>
              Horizontal: <Text style={styles.valText}>{metrics.coiX >= 0 ? `+${metrics.coiX.toFixed(2)}"` : `${metrics.coiX.toFixed(2)}"`}</Text>
              {'  |  '}
              Vertical: <Text style={styles.valText}>{metrics.coiY >= 0 ? `+${metrics.coiY.toFixed(2)}"` : `${metrics.coiY.toFixed(2)}"`}</Text>
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.cardPrompt}>
          <Text style={styles.promptText}>
            Tap on the target face above to place at least {3 - shots.length} more shot(s).
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16 },
  header: { fontSize: 18, fontWeight: '900', color: '#10b981' },
  sub: { color: '#94a3b8', fontSize: 11, marginBottom: 16, marginTop: 2 },
  targetWrapper: { alignItems: 'center', marginBottom: 16 },
  targetCanvas: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#33415588',
  },
  crosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#334155aa',
  },
  crosshairV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#334155aa',
  },
  shotDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shotNumber: { color: '#ffffff', fontSize: 7, fontWeight: '900' },
  coiMarker: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cepRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    backgroundColor: '#38bdf822',
    borderStyle: 'dashed',
  },
  controlsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  secondaryBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  secondaryBtnText: { color: '#cbd5e1', fontSize: 11, fontWeight: '700' },
  dangerBtn: {
    backgroundColor: '#ef444422',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef444444',
  },
  dangerBtnText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardPrompt: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  promptText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  cardTitle: { color: '#10b981', fontSize: 11, fontWeight: '900', marginBottom: 12 },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: { color: '#64748b', fontSize: 8, fontWeight: '800' },
  metricHighlight: { color: '#38bdf8', fontSize: 20, fontWeight: '900', marginTop: 2 },
  metricValue: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginTop: 2 },
  metricSub: { color: '#94a3b8', fontSize: 9, marginTop: 2 },
  coiBox: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  coiTitle: { color: '#64748b', fontSize: 9, fontWeight: '800', marginBottom: 2 },
  coiText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  valText: { color: '#38bdf8', fontWeight: '800' },
});