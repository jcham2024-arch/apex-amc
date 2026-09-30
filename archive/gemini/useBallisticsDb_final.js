import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput } from 'react-native';

export default function TransonicStabilityScreen() {
  const [tempF, setTempF] = useState('59');
  const [velocity, setVelocity] = useState('2700');
  const [sg, setSg] = useState('1.45');

  // Transonic Calculation Math
  const temp = parseFloat(tempF) || 59;
  const vel = parseFloat(velocity) || 2700;
  const gyroscopicSg = parseFloat(sg) || 1.45;

  const speedOfSoundFps = 49.022 * Math.sqrt(temp + 459.67);
  const transonicCutoffFps = 1.2 * speedOfSoundFps;
  
  // Approximate distance where bullet drops to Mach 1.2
  const distanceToTransonicYds = Math.max(0, Math.round((vel - transonicCutoffFps) / 1.4));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Transonic Boundary & Stability ($S_g$)</Text>

      {/* Input Parameters */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>BALLISTIC INPUTS</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>TEMP (°F)</Text>
            <TextInput style={styles.input} value={tempF} onChangeText={setTempF} keyboardType="numeric" />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>MUZZLE VEL (FPS)</Text>
            <TextInput style={styles.input} value={velocity} onChangeText={setVelocity} keyboardType="numeric" />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>STABILITY (Sg)</Text>
            <TextInput style={styles.input} value={sg} onChangeText={setSg} keyboardType="numeric" />
          </View>
        </View>
      </View>

      {/* Speed of Sound Engine */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ACOUSTIC & BOUNDARY RESULTS</Text>
        <View style={styles.resRow}>
          <Text style={styles.resLabel}>Speed of Sound (Mach 1.0):</Text>
          <Text style={styles.resVal}>{speedOfSoundFps.toFixed(0)} fps</Text>
        </View>
        <View style={styles.resRow}>
          <Text style={styles.resLabel}>Transonic Cutoff (Mach 1.2):</Text>
          <Text style={styles.resVal}>{transonicCutoffFps.toFixed(0)} fps</Text>
        </View>
        <View style={styles.resRow}>
          <Text style={styles.resLabel}>Est. Distance to Transonic:</Text>
          <Text style={styles.highlightVal}>~{distanceToTransonicYds} yards</Text>
        </View>
      </View>

      {/* Stability Warning Indicator */}
      <View style={[styles.card, { borderColor: gyroscopicSg >= 1.5 ? '#10b981' : '#ef4444' }]}>
        <Text style={[styles.statusTitle, { color: gyroscopicSg >= 1.5 ? '#10b981' : '#ef4444' }]}>
          {gyroscopicSg >= 1.5 ? '✓ FULLY STABILIZED IN TRANSONIC' : '⚠️ MARGINAL STABILITY WARNING'}
        </Text>
        <Text style={styles.statusDesc}>
          {gyroscopicSg >= 1.5
            ? `Your Gyroscopic Stability factor (Sg = ${gyroscopicSg}) exceeds the 1.5 threshold. The bullet will transition smoothly past Mach 1.2 without pitching.`
            : `Your Gyroscopic Stability factor (Sg = ${gyroscopicSg}) is below 1.5. Expect yawing, increased dispersion, and potential bullet tumbling beyond ~${distanceToTransonicYds} yards.`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  header: { fontSize: 16, fontWeight: '900', color: '#10b981', marginBottom: 12 },
  card: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#64748b', fontSize: 9, fontWeight: '900', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputWrap: { flex: 1 },
  label: { color: '#94a3b8', fontSize: 8, fontWeight: '800', marginBottom: 4 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 6, borderRadius: 4, borderWidth: 1, borderColor: '#334155', fontSize: 12, fontWeight: '700' },
  resRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  resLabel: { color: '#cbd5e1', fontSize: 11 },
  resVal: { color: '#f8fafc', fontSize: 11, fontWeight: '800' },
  highlightVal: { color: '#38bdf8', fontSize: 12, fontWeight: '900' },
  statusTitle: { fontSize: 11, fontWeight: '900', marginBottom: 4 },
  statusDesc: { color: '#94a3b8', fontSize: 10, lineHeight: 14 },
});