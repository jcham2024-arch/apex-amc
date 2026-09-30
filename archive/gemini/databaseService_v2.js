import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { calculateAdvancedStats } from './ballisticsStats';

export default function TargetAnalyzerAdvanced() {
  const [mode, setMode] = useState('POA'); // 'SCALE' | 'POA' | 'SHOTS'
  const [scalePoints, setScalePoints] = useState([]);
  const [poa, setPoa] = useState(null); // {x, y}
  const [shots, setShots] = useState([]); // [{x, y}, ...]

  const distanceYards = 100;
  const refSizeInches = 1.0;
  const turretUnit = 'MOA'; // 'MOA' or 'MIL'
  const clickValue = 0.25;  // 1/4 MOA per click

  const [imageUri] = useState(
    'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=800&q=80'
  );

  const handleImagePress = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const pt = { x: locationX, y: locationY };

    if (mode === 'SCALE') {
      setScalePoints(scalePoints.length < 2 ? [...scalePoints, pt] : [pt]);
    } else if (mode === 'POA') {
      setPoa(pt);
      setMode('SHOTS'); // Auto-advance to shots entry
    } else if (mode === 'SHOTS') {
      setShots([...shots, pt]);
    }
  };

  // Calculate Pixels Per Inch (PPI)
  let ppi = 0;
  if (scalePoints.length === 2) {
    const dx = scalePoints[1].x - scalePoints[0].x;
    const dy = scalePoints[1].y - scalePoints[0].y;
    ppi = Math.sqrt(dx * dx + dy * dy) / refSizeInches;
  }

  // Compute Mean Radius & Scope Corrections
  const stats = calculateAdvancedStats({
    shots,
    poa,
    ppi,
    distanceYards,
    unit: turretUnit,
    clickValue
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Zero & Group Analysis</Text>

        {/* Target Image Touch Canvas */}
        <View style={styles.imageContainer}>
          <Pressable onPress={handleImagePress} style={styles.pressableArea}>
            <Image source={{ uri: imageUri }} style={styles.targetImage} resizeMode="contain" />

            {/* Render Scale Points */}
            {scalePoints.map((pt, idx) => (
              <View key={`scale-${idx}`} style={[styles.markerScale, { left: pt.x - 6, top: pt.y - 6 }]} />
            ))}

            {/* Render Point of Aim (Bullseye) */}
            {poa && (
              <View style={[styles.markerPoa, { left: poa.x - 10, top: poa.y - 10 }]}>
                <View style={styles.poaCrosshairV} />
                <View style={styles.poaCrosshairH} />
              </View>
            )}

            {/* Render Shots */}
            {shots.map((pt, idx) => (
              <View key={`shot-${idx}`} style={[styles.markerShot, { left: pt.x - 8, top: pt.y - 8 }]}>
                <Text style={styles.shotLabel}>{idx + 1}</Text>
              </View>
            ))}

            {/* Render Calculated Center of Impact (POI) */}
            {stats?.poi && (
              <View style={[styles.markerPoi, { left: stats.poi.x - 8, top: stats.poi.y - 8 }]} />
            )}
          </Pressable>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'SCALE' && styles.modeBtnActive]}
            onPress={() => setMode('SCALE')}
          >
            <Text style={styles.modeBtnText}>1. SCALE ({scalePoints.length}/2)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'POA' && styles.modeBtnActive]}
            onPress={() => setMode('POA')}
          >
            <Text style={styles.modeBtnText}>2. AIM POINT ({poa ? '✓' : 'TAP'})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'SHOTS' && styles.modeBtnActive]}
            onPress={() => setMode('SHOTS')}
          >
            <Text style={styles.modeBtnText}>3. SHOTS ({shots.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Results Panel */}
        {stats && (
          <View style={styles.resultsPanel}>
            {/* Mean Radius Banner */}
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>MEAN RADIUS (MR)</Text>
              <Text style={styles.statValHighlight}>{stats.meanRadiusInches}" <Text style={styles.unit}>({stats.meanRadiusAngular} {turretUnit})</Text></Text>
            </View>

            {/* Scope Click Adjustments */}
            {stats.zeroOffset && (
              <View style={styles.correctionCard}>
                <Text style={styles.correctionHeader}>🎯 TURRET ZERO CORRECTIONS</Text>
                
                <View style={styles.correctionRow}>
                  <View style={styles.corrGroup}>
                    <Text style={styles.corrLabel}>ELEVATION</Text>
                    <Text style={styles.corrAction}>
                      DIAL {stats.zeroOffset.vClicks} CLICKS {stats.zeroOffset.vDirection}
                    </Text>
                    <Text style={styles.corrSub}>{stats.zeroOffset.dyAngular} {turretUnit} ({stats.zeroOffset.dyInches}")</Text>
                  </View>

                  <View style={styles.corrGroup}>
                    <Text style={styles.corrLabel}>WINDAGE</Text>
                    <Text style={styles.corrAction}>
                      DIAL {stats.zeroOffset.hClicks} CLICKS {stats.zeroOffset.hDirection}
                    </Text>
                    <Text style={styles.corrSub}>{stats.zeroOffset.dxAngular} {turretUnit} ({stats.zeroOffset.dxInches}")</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16 },
  header: { fontSize: 18, fontWeight: '900', color: '#10b981', textAlign: 'center', marginBottom: 12 },
  imageContainer: { width: '100%', height: 300, backgroundColor: '#1e293b', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  pressableArea: { width: '100%', height: '100%' },
  targetImage: { width: '100%', height: '100%' },
  markerScale: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#38bdf8', borderWidth: 2, borderColor: '#fff' },
  markerPoa: { position: 'absolute', width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  poaCrosshairV: { position: 'absolute', width: 2, height: 20, backgroundColor: '#eab308' },
  poaCrosshairH: { position: 'absolute', width: 20, height: 2, backgroundColor: '#eab308' },
  markerShot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  shotLabel: { color: '#fff', fontSize: 8, fontWeight: '900' },
  markerPoi: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#10b981', backgroundColor: 'transparent' },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modeBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 8, borderRadius: 6, marginHorizontal: 2, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  modeBtnActive: { backgroundColor: '#064e3b', borderColor: '#10b981' },
  modeBtnText: { color: '#f8fafc', fontSize: 10, fontWeight: '800' },
  resultsPanel: { marginTop: 4 },
  statBox: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#38bdf8', marginBottom: 12 },
  statTitle: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },
  statValHighlight: { color: '#f8fafc', fontSize: 18, fontWeight: '900', marginTop: 2 },
  unit: { fontSize: 12, color: '#38bdf8' },
  correctionCard: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#10b981' },
  correctionHeader: { color: '#10b981', fontSize: 12, fontWeight: '900', marginBottom: 8 },
  correctionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  corrGroup: { flex: 1, backgroundColor: '#0f172a', padding: 8, borderRadius: 6, marginHorizontal: 4 },
  corrLabel: { color: '#64748b', fontSize: 9, fontWeight: '800' },
  corrAction: { color: '#fbbf24', fontSize: 12, fontWeight: '900', marginTop: 2 },
  corrSub: { color: '#94a3b8', fontSize: 10, marginTop: 1 }
});