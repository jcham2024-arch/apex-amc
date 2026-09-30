import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput } from 'react-native';

export default function PowderTempSensitivityScreen() {
  const [baseTemp, setBaseTemp] = useState('70');
  const [baseVelocity, setBaseVelocity] = useState('2700');
  const [currentTemp, setCurrentTemp] = useState('35');
  const [tempCoeff, setTempCoeff] = useState('1.2');

  const tBase = parseFloat(baseTemp) || 70;
  const vBase = parseFloat(baseVelocity) || 2700;
  const tCurr = parseFloat(currentTemp) || 35;
  const coeff = parseFloat(tempCoeff) || 1.2;

  const deltaT = tCurr - tBase;
  const calculatedVelocity = vBase + deltaT * coeff;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Powder Temperature Sensitivity ($C_T$)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>BASELINE CHRONO INPUTS</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>BASE TEMP (°F)</Text>
            <TextInput style={styles.input} value={baseTemp} onChangeText={setBaseTemp} keyboardType="numeric" />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>BASE VEL (FPS)</Text>
            <TextInput style={styles.input} value={baseVelocity} onChangeText={setBaseVelocity} keyboardType="numeric" />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>FIELD ENVIRONMENT</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>FIELD TEMP (°F)</Text>
            <TextInput style={styles.input} value={currentTemp} onChangeText={setCurrentTemp} keyboardType="numeric" />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>SENSITIVITY (fps/°F)</Text>
            <TextInput style={styles.input} value={tempCoeff} onChangeText={setTempCoeff} keyboardType="numeric" />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>CORRECTED MUZZLE VELOCITY</Text>
        <Text style={styles.bigVal}>{calculatedVelocity.toFixed(1)} FPS</Text>
        <Text style={styles.subText}>
          Offset: {deltaT >= 0 ? `+${(deltaT * coeff).toFixed(1)}` : (deltaT * coeff).toFixed(1)} FPS from baseline
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
  bigVal: { color: '#38bdf8', fontSize: 28, fontWeight: '900', textAlign: 'center', marginVertical: 4 },
  subText: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },
});
