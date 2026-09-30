import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from 'react-native';

export default function TargetGroupCalculator() {
  // Input parameters
  const [targetDistanceYards, setTargetDistanceYards] = useState('100');
  const [refSizeInches, setRefSizeInches] = useState('1.0');
  
  // Interaction mode: 'SCALE' (tap 2 points) or 'SHOTS' (tap bullet holes)
  const [mode, setMode] = useState('SCALE'); 

  // Tap coordinates
  const [scalePoints, setScalePoints] = useState([]); // [{x, y}, {x, y}]
  const [shots, setShots] = useState([]);             // [{x, y}, ...]

  // Local sample target image URL
  const [imageUri] = useState('https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=800&q=80');

  // Tap handler on the target image
  const handleImagePress = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const newPoint = { x: locationX, y: locationY };

    if (mode === 'SCALE') {
      if (scalePoints.length < 2) {
        setScalePoints([...scalePoints, newPoint]);
      } else {
        // Reset scale if tapped again
        setScalePoints([newPoint]);
      }
    } else if (mode === 'SHOTS') {
      setShots([...shots, newPoint]);
    }
  };

  // Geometry calculations
  const calculateResults = () => {
    if (scalePoints.length < 2) {
      return { ppi: 0, groupInches: 0, moa: 0, mil: 0, maxPair: null };
    }

    // 1. Calculate Pixels Per Inch (PPI)
    const dxScale = scalePoints[1].x - scalePoints[0].x;
    const dyScale = scalePoints[1].y - scalePoints[0].y;
    const pixelDistanceRef = Math.sqrt(dxScale * dxScale + dyScale * dyScale);
    const refInches = parseFloat(refSizeInches) || 1.0;
    const ppi = pixelDistanceRef / refInches;

    if (shots.length < 2 || ppi === 0) {
      return { ppi, groupInches: 0, moa: 0, mil: 0, maxPair: null };
    }

    // 2. Find Maximum Extreme Spread among shots
    let maxPxDist = 0;
    let maxPair = null;

    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const dx = shots[j].x - shots[i].x;
        const dy = shots[j].y - shots[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxPxDist) {
          maxPxDist = dist;
          maxPair = [shots[i], shots[j]];
        }
      }
    }

    // 3. Convert to Inches, MOA, and MILs
    const groupInches = maxPxDist / ppi;
    const yards = parseFloat(targetDistanceYards) || 100;
    const moa = groupInches / (yards * 0.010472);
    const mil = groupInches / (yards * 0.036);

    return {
      ppi: ppi.toFixed(1),
      groupInches: groupInches.toFixed(2),
      moa: moa.toFixed(2),
      mil: mil.toFixed(2),
      maxPair
    };
  };

  const results = calculateResults();

  const resetAll = () => {
    setScalePoints([]);
    setShots([]);
    setMode('SCALE');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.title}>Target Group Analyzer</Text>

        {/* Target Image Touch Canvas */}
        <View style={styles.imageContainer}>
          <Pressable onPress={handleImagePress} style={styles.pressableArea}>
            <Image
              source={{ uri: imageUri }}
              style={styles.targetImage}
              resizeMode="contain"
            />

            {/* Render Calibration Markers (Blue) */}
            {scalePoints.map((pt, idx) => (
              <View
                key={`scale-${idx}`}
                style={[styles.scaleMarker, { left: pt.x - 8, top: pt.y - 8 }]}
              >
                <Text style={styles.markerLabel}>R{idx + 1}</Text>
              </View>
            ))}

            {/* Render Shot Markers (Red) */}
            {shots.map((pt, idx) => (
              <View
                key={`shot-${idx}`}
                style={[styles.shotMarker, { left: pt.x - 10, top: pt.y - 10 }]}
              >
                <Text style={styles.shotLabel}>{idx + 1}</Text>
              </View>
            ))}
          </Pressable>
        </View>

        {/* Mode Controls */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'SCALE' && styles.activeModeBtn]}
            onPress={() => setMode('SCALE')}
          >
            <Text style={styles.modeBtnText}>
              1. CALIBRATE SCALE ({scalePoints.length}/2)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === 'SHOTS' && styles.activeModeBtn]}
            onPress={() => setMode('SHOTS')}
          >
            <Text style={styles.modeBtnText}>
              2. TAP SHOTS ({shots.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Parameters & Inputs */}
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Known Ref Size (in)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={refSizeInches}
                onChangeText={setRefSizeInches}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Distance (yds)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targetDistanceYards}
                onChangeText={setTargetDistanceYards}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
            <Text style={styles.resetBtnText}>RESET ALL MARKERS</Text>
          </TouchableOpacity>
        </View>

        {/* Group Analysis Output */}
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>GROUP METRICS</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>EXTREME SPREAD</Text>
              <Text style={styles.metricValueHighlight}>{results.groupInches}"</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>GROUP MOA</Text>
              <Text style={styles.metricValue}>{results.moa} MOA</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>GROUP MIL</Text>
              <Text style={styles.metricValue}>{results.mil} MIL</Text>
            </View>
          </View>
          <Text style={styles.subtext}>
            Scale: {results.ppi} PPI | Shots Placed: {shots.length}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '900', color: '#10b981', marginBottom: 12, textAlign: 'center' },
  imageContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12
  },
  pressableArea: { width: '100%', height: '100%' },
  targetImage: { width: '100%', height: '100%' },
  scaleMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#38bdf8',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  markerLabel: { color: '#0f172a', fontSize: 8, fontWeight: '900' },
  shotMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  shotLabel: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modeBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginHorizontal: 4, alignItems: 'center' },
  activeModeBtn: { backgroundColor: '#064e3b', borderColor: '#10b981' },
  modeBtnText: { color: '#f8fafc', fontSize: 11, fontWeight: '800' },
  inputCard: { backgroundColor: '#1e293b', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { flex: 1, marginHorizontal: 4 },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#475569', fontSize: 14, fontWeight: '700' },
  resetBtn: { marginTop: 10, backgroundColor: '#334155', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  resetBtnText: { color: '#ef4444', fontSize: 11, fontWeight: '800' },
  resultsCard: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#10b981' },
  resultsTitle: { color: '#10b981', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metricItem: { alignItems: 'center' },
  metricLabel: { color: '#64748b', fontSize: 9, fontWeight: '700' },
  metricValue: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginTop: 2 },
  metricValueHighlight: { color: '#38bdf8', fontSize: 20, fontWeight: '900' },
  subtext: { color: '#64748b', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }
});