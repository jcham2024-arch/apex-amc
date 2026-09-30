import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';

// Historical sessions data: Cold bore offset in inches relative to warm POI (0,0)
const historicalColdBores = [
  { sessionId: '1', date: 'Oct 12', dxInches: -0.4, dyInches: 0.8 },
  { sessionId: '2', date: 'Oct 19', dxInches: -0.3, dyInches: 0.7 },
  { sessionId: '3', date: 'Nov 02', dxInches: -0.5, dyInches: 0.9 },
  { sessionId: '4', date: 'Nov 15', dxInches: -0.2, dyInches: 0.6 },
];

export default function ColdBoreTracker() {
  const n = historicalColdBores.length;

  // Calculate Average Systemic Cold Bore Offset
  const avgDx = historicalColdBores.reduce((sum, s) => sum + s.dxInches, 0) / n;
  const avgDy = historicalColdBores.reduce((sum, s) => sum + s.dyInches, 0) / n;

  // Grid Scale: 100px = 2.0 inches
  const SCALE_PX_PER_INCH = 50;
  const GRID_SIZE = 200; // 200x200 canvas

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Cold Bore Drift Analyzer</Text>
      <Text style={styles.sub}>
        Historical aggregate of First Round Impacts relative to Warm Group POI (Center Crosshair).
      </Text>

      {/* Visual Target Grid Overlay */}
      <View style={styles.gridContainer}>
        <View style={[styles.gridCanvas, { width: GRID_SIZE, height: GRID_SIZE }]}>
          {/* Target Grid Lines */}
          <View style={styles.gridCrosshairV} />
          <View style={styles.gridCrosshairH} />

          {/* 1-Inch Ring */}
          <View
            style={[
              styles.ring,
              {
                width: SCALE_PX_PER_INCH * 2,
                height: SCALE_PX_PER_INCH * 2,
                borderRadius: SCALE_PX_PER_INCH,
              },
            ]}
          />

          {/* Render Historical Cold Bore Dots */}
          {historicalColdBores.map((s, idx) => {
            const leftPx = GRID_SIZE / 2 + s.dxInches * SCALE_PX_PER_INCH - 4;
            const topPx = GRID_SIZE / 2 - s.dyInches * SCALE_PX_PER_INCH - 4; // Screen Y inverted

            return (
              <View
                key={idx}
                style={[styles.coldShotDot, { left: leftPx, top: topPx }]}
              />
            );
          })}

          {/* Render Systemic Mean Cold Bore Vector (Green Ring) */}
          <View
            style={[
              styles.meanColdVector,
              {
                left: GRID_SIZE / 2 + avgDx * SCALE_PX_PER_INCH - 8,
                top: GRID_SIZE / 2 - avgDy * SCALE_PX_PER_INCH - 8,
              },
            ]}
          />
        </View>
      </View>

      {/* Systemic Offset Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>SYSTEMIC COLD BORE OFFSET</Text>
        <Text style={styles.summarySub}>Averaged over {n} range sessions</Text>

        <View style={styles.vectorRow}>
          <View style={styles.vectorBox}>
            <Text style={styles.vLabel}>VERTICAL SHIFT</Text>
            <Text style={styles.vVal}>
              {avgDy >= 0 ? `+${avgDy.toFixed(2)}"` : `${avgDy.toFixed(2)}"`} {avgDy > 0 ? 'HIGH' : 'LOW'}
            </Text>
          </View>

          <View style={styles.vectorBox}>
            <Text style={styles.vLabel}>HORIZONTAL SHIFT</Text>
            <Text style={styles.vVal}>
              {avgDx >= 0 ? `+${avgDx.toFixed(2)}"` : `${avgDx.toFixed(2)}"`} {avgDx > 0 ? 'RIGHT' : 'LEFT'}
            </Text>
          </View>
        </View>

        <View style={styles.holdoverRecommendation}>
          <Text style={styles.recTitle}>🎯 FIRST-SHOT HOLDOVER CORRECTION</Text>
          <Text style={styles.recText}>
            For a cold-bore first shot, hold <Text style={styles.highlight}>{Math.abs(avgDy).toFixed(2)}" {avgDy > 0 ? 'LOW' : 'HIGH'}</Text> and <Text style={styles.highlight}>{Math.abs(avgDx).toFixed(2)}" {avgDx > 0 ? 'LEFT' : 'RIGHT'}</Text> to hit dead center.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16 },
  header: { fontSize: 18, fontWeight: '900', color: '#10b981' },
  sub: { color: '#94a3b8', fontSize: 11, marginBottom: 16, marginTop: 2 },
  gridContainer: { alignItems: 'center', marginVertical: 12 },
  gridCanvas: { backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155', position: 'relative', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  gridCrosshairV: { position: 'absolute', width: 1, top: 0, bottom: 0, backgroundColor: '#475569' },
  gridCrosshairH: { position: 'absolute', height: 1, left: 0, right: 0, backgroundColor: '#475569' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: '#334155' },
  coldShotDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#fff' },
  meanColdVector: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  summaryCard: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#334155' },
  summaryTitle: { color: '#10b981', fontSize: 12, fontWeight: '900' },
  summarySub: { color: '#64748b', fontSize: 10, marginBottom: 12 },
  vectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  vectorBox: { flex: 1, backgroundColor: '#0f172a', padding: 10, borderRadius: 6, marginHorizontal: 2 },
  vLabel: { color: '#64748b', fontSize: 9, fontWeight: '800' },
  vVal: { color: '#f8fafc', fontSize: 14, fontWeight: '900', marginTop: 2 },
  holdoverRecommendation: { backgroundColor: '#064e3b33', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#10b981' },
  recTitle: { color: '#10b981', fontSize: 10, fontWeight: '900', marginBottom: 2 },
  recText: { color: '#cbd5e1', fontSize: 11, lineHeight: 16 },
  highlight: { color: '#fbbf24', fontWeight: '800' },
});