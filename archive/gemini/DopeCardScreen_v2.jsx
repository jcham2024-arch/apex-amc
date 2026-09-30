import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

export default function TallTargetTestScreen() {
  const [distanceYards, setDistanceYards] = useState('100');
  const [dialedUnits, setDialedUnits] = useState('30'); // Dialed 30 MOA or 10 MIL
  const [unit, setUnit] = useState('MOA'); // 'MOA' or 'MIL'
  const [measuredInches, setMeasuredInches] = useState('30.6'); // Actual distance on target paper
  const [result, setResult] = useState(null);

  const calculateTracking = () => {
    const dist = parseFloat(distanceYards);
    const dialed = parseFloat(dialedUnits);
    const measured = parseFloat(measuredInches);

    if (!dist || !dialed || !measured) return;

    const angularFactor = unit === 'MOA' ? 0.010472 : 0.036;
    const expectedInches = dist * angularFactor * dialed;
    const multiplier = measured / expectedInches;
    const errorPct = (multiplier - 1) * 100;

    setResult({
      expectedInches: expectedInches.toFixed(2),
      measuredInches: measured.toFixed(2),
      multiplier: multiplier.toFixed(4),
      errorPct: errorPct.toFixed(1),
      isUnderTracking: multiplier < 1.0,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Scope Tall Target Calibration</Text>
      <Text style={styles.sub}>
        Shoot a bottom group at target zero, dial up elevation (e.g. 30 MOA), fire a top group, and measure vertical distance.
      </Text>

      {/* Input Fields */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Distance (Yards)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={distanceYards}
          onChangeText={setDistanceYards}
        />
      </View>

      <View style={styles.unitRow}>
        <TouchableOpacity
          style={[styles.unitBtn, unit === 'MOA' && styles.unitBtnActive]}
          onPress={() => setUnit('MOA')}
        >
          <Text style={styles.unitBtnText}>MOA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unitBtn, unit === 'MIL' && styles.unitBtnActive]}
          onPress={() => setUnit('MIL')}
        >
          <Text style={styles.unitBtnText}>MIL / MRAD</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Dialed Turret Elevation ({unit})</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={dialedUnits}
          onChangeText={setDialedUnits}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Measured Distance Between Group Centers (Inches)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={measuredInches}
          onChangeText={setMeasuredInches}
        />
      </View>

      <TouchableOpacity style={styles.calcBtn} onPress={calculateTracking}>
        <Text style={styles.calcBtnText}>CALCULATE SCOPE MULTIPLIER</Text>
      </TouchableOpacity>

      {/* Results Output */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>CALIBRATION RESULTS</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Expected Height:</Text>
            <Text style={styles.resultVal}>{result.expectedInches}"</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Measured Height:</Text>
            <Text style={styles.resultVal}>{result.measuredInches}"</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tracking Error:</Text>
            <Text style={[styles.resultVal, Math.abs(parseFloat(result.errorPct)) > 1.5 ? styles.valRed : styles.valGreen]}>
              {result.errorPct > 0 ? `+${result.errorPct}` : result.errorPct}%
            </Text>
          </View>

          <View style={styles.multiplierBox}>
            <Text style={styles.multLabel}>BALLISTIC SOLVER MULTIPLIER</Text>
            <Text style={styles.multVal}>{result.multiplier}</Text>
            <Text style={styles.multSub}>
              Enter this value into your ballistic solver under "Scope Correction Factor" to correct elevation outputs.
            </Text>
          </View>
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
  inputGroup: { marginBottom: 12 },
  label: { color: '#64748b', fontSize: 10, fontWeight: '800', marginBottom: 4 },
  input: { backgroundColor: '#1e293b', color: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#334155', fontSize: 14, fontWeight: '700' },
  unitRow: { flexDirection: 'row', marginBottom: 12 },
  unitBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 8, alignItems: 'center', borderRadius: 6, marginHorizontal: 2, borderWidth: 1, borderColor: '#334155' },
  unitBtnActive: { backgroundColor: '#064e3b', borderColor: '#10b981' },
  unitBtnText: { color: '#f8fafc', fontSize: 11, fontWeight: '800' },
  calcBtn: { backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  calcBtnText: { color: '#0f172a', fontWeight: '900', fontSize: 12 },
  resultCard: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginTop: 16, borderWidth: 1, borderColor: '#10b981' },
  resultTitle: { color: '#10b981', fontSize: 12, fontWeight: '900', marginBottom: 10 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  resultLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  resultVal: { color: '#f8fafc', fontSize: 11, fontWeight: '800' },
  valRed: { color: '#ef4444' },
  valGreen: { color: '#10b981' },
  multiplierBox: { backgroundColor: '#0f172a', padding: 10, borderRadius: 6, marginTop: 10, alignItems: 'center' },
  multLabel: { color: '#64748b', fontSize: 9, fontWeight: '800' },
  multVal: { color: '#38bdf8', fontSize: 22, fontWeight: '900', marginVertical: 2 },
  multSub: { color: '#94a3b8', fontSize: 9, textAlign: 'center', marginTop: 2 },
});