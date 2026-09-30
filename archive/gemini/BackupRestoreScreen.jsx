import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

const sampleLadderData = [
  { charge: 41.0, meanRadius: 0.82, vertPoi: 0.0, velocity: 2680 },
  { charge: 41.3, meanRadius: 0.55, vertPoi: 0.3, velocity: 2705 },
  { charge: 41.6, meanRadius: 0.38, vertPoi: 0.4, velocity: 2720 },
  { charge: 41.9, meanRadius: 0.42, vertPoi: 0.4, velocity: 2735 },
  { charge: 42.2, meanRadius: 0.91, vertPoi: 0.9, velocity: 2765 },
];

export default function LoadLadderScreen() {
  const [ladder, setLadder] = useState(sampleLadderData);

  // Identify OCW Nodes: Where Vertical POI derivative is near zero across adjacent steps
  const detectNodes = () => {
    return ladder.map((step, idx) => {
      if (idx === 0 || idx === ladder.length - 1) return { ...step, isNode: false };
      
      const prev = ladder[idx - 1];
      const next = ladder[idx + 1];
      
      const deltaPoiPrev = Math.abs(step.vertPoi - prev.vertPoi);
      const deltaPoiNext = Math.abs(next.vertPoi - step.vertPoi);
      
      // Node condition: POI shift stays within 0.15" between charges AND group size is small
      const isFlatPoi = deltaPoiPrev <= 0.15 && deltaPoiNext <= 0.15;
      const isSmallGroup = step.meanRadius <= 0.5;

      return {
        ...step,
        isNode: isFlatPoi && isSmallGroup,
      };
    });
  };

  const processedData = detectNodes();
  const maxVelocity = Math.max(...ladder.map((d) => d.velocity));
  const minVelocity = Math.min(...ladder.map((d) => d.velocity));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Load Ladder / OCW Node Finder</Text>
      <Text style={styles.sub}>
        Look for adjacent powder steps with flat vertical POI and small Mean Radius.
      </Text>

      {/* Graphical Ladder Cards */}
      {processedData.map((item, idx) => {
        const velBarWidth = `${((item.velocity - minVelocity) / (maxVelocity - minVelocity || 1)) * 100}%`;

        return (
          <View
            key={idx}
            style={[styles.card, item.isNode && styles.cardNodeActive]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.chargeText}>{item.charge} gr</Text>
              {item.isNode && (
                <View style={styles.nodeBadge}>
                  <Text style={styles.nodeBadgeText}>🎯 ACCURACY NODE</Text>
                </View>
              )}
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>MEAN RADIUS</Text>
                <Text style={[styles.metricVal, item.meanRadius <= 0.4 && styles.valGreen]}>
                  {item.meanRadius}"
                </Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>VERT POI SHIFT</Text>
                <Text style={styles.metricVal}>
                  {item.vertPoi >= 0 ? `+${item.vertPoi}` : item.vertPoi}"
                </Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>VELOCITY</Text>
                <Text style={styles.metricVal}>{item.velocity} fps</Text>
              </View>
            </View>

            {/* Visual Velocity Bar */}
            <View style={styles.velBarTrack}>
              <View style={[styles.velBarFill, { width: velBarWidth }]} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16 },
  header: { fontSize: 18, fontWeight: '900', color: '#10b981' },
  sub: { color: '#94a3b8', fontSize: 11, marginBottom: 16, marginTop: 2 },
  card: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardNodeActive: { borderColor: '#10b981', borderWidth: 2, backgroundColor: '#064e3b22' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chargeText: { color: '#f8fafc', fontSize: 16, fontWeight: '900' },
  nodeBadge: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  nodeBadgeText: { color: '#0f172a', fontSize: 9, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricBox: { flex: 1 },
  metricLabel: { color: '#64748b', fontSize: 9, fontWeight: '800' },
  metricVal: { color: '#f8fafc', fontSize: 14, fontWeight: '800', marginTop: 2 },
  valGreen: { color: '#10b981' },
  velBarTrack: { height: 4, backgroundColor: '#334155', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  velBarFill: { height: '100%', backgroundColor: '#38bdf8' },
});