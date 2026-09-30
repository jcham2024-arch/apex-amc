import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput } from 'react-native';

export default function TransonicStabilityScreen() {
  const [tempF, setTempF] = useState('59');
  const [velocity, setVelocity] = useState('2700');
  const [sg, setSg] = useState('1.45');

  const temp = parseFloat(tempF) || 59;
  const vel = parseFloat(velocity) || 2700;
  const gyroscopicSg = parseFloat(sg) || 1.45;

  const speedOfSoundFps = 49.022 * Math.sqrt(temp + 459.67);
  const transonicCutoffFps = 1.2 * speedOfSoundFps;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Transonic Boundary & Stability ($S_g$)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>INPUTS</Text>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>RESULTS</Text>
        <Text style={styles.resText}>Mach 1.0 (Speed of Sound): {speedOfSoundFps.toFixed(0)} FPS</Text>
        <Text style={styles.resText}>Mach 1.2 (Transonic Threshold): {transonicCutoffFps.toFixed(0)} FPS</Text>
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
  resText: { color: '#cbd5e1', fontSize: 12, marginVertical: 2 },
});
