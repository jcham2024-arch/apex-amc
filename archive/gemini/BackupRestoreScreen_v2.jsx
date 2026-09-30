import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

export default function PowderTempSensitivityScreen() {
  // Session logs: Temp (°F) vs Muzzle Velocity (fps)
  const [logs, setLogs] = useState([
    { id: '1', tempF: '35', velocityFps: '2680' },
    { id: '2', tempF: '85', velocityFps: '2730' },
  ]);

  const [newTemp, setNewTemp] = useState('');
  const [newVel, setNewVel] = useState('');

  // Add new session log
  const addLog = () => {
    if (!newTemp || !newVel) {
      Alert.alert('Missing Input', 'Please enter both temperature and velocity.');
      return;
    }
    setLogs([
      ...logs,
      { id: Date.now().toString(), tempF: newTemp, velocityFps: newVel },
    ]);
    setNewTemp('');
    setNewVel('');
  };

  // Remove a session log
  const removeLog = (id) => {
    if (logs.length <= 2) {
      Alert.alert('Minimum Requirement', 'You need at least 2 sessions to calculate sensitivity.');
      return;
    }
    setLogs(logs.filter((item) => item.id !== id));
  };

  // Perform Least-Squares Linear Regression: V(T) = (C_T * T) + V_0
  const calculateSensitivity = () => {
    const validPoints = logs
      .map((l) => ({ t: parseFloat(l.tempF), v: parseFloat(l.velocityFps) }))
      .filter((p) => !isNaN(p.t) && !isNaN(p.v));

    if (validPoints.length < 2) return null;

    const n = validPoints.length;
    const sumT = validPoints.reduce((acc, p) => acc + p.t, 0);
    const sumV = validPoints.reduce((acc, p) => acc + p.v, 0);
    const sumTV = validPoints.reduce((acc, p) => acc + p.t * p.v, 0);
    const sumT2 = validPoints.reduce((acc, p) => acc + p.t * p.t, 0);

    const denominator = n * sumT2 - sumT * sumT;
    if (denominator === 0) return null; // Avoid division by zero if all temps are identical

    // Slope (C_T) in fps per °F
    const ct = (n * sumTV - sumT * sumV) / denominator;
    
    // Y-intercept (theoretical velocity at 0°F)
    const intercept = (sumV - ct * sumT) / n;

    // Qualitative assessment
    let stabilityRating = 'EXTREMELY STABLE';
    let ratingColor = '#10b981'; // Green
    if (Math.abs(ct) > 1.2) {
      stabilityRating = 'HIGHLY SENSITIVE';
      ratingColor = '#ef4444'; // Red
    } else if (Math.abs(ct) > 0.6) {
      stabilityRating = 'MODERATE SENSITIVITY';
      ratingColor = '#f59e0b'; // Amber
    }

    // Generate predicted velocity matrix (-10°F to 110°F in 20° steps)
    const steps = [-10, 10, 30, 50, 70, 90, 110];
    const predictions = steps.map((temp) => ({
      temp,
      predictedFps: Math.round(intercept + ct * temp),
      deltaFps: Math.round((temp - 70) * ct), // Shift relative to standard 70°F
    }));

    return {
      ct: ct.toFixed(2),
      intercept: intercept.toFixed(0),
      stabilityRating,
      ratingColor,
      predictions,
      avgTemp: (sumT / n).toFixed(0),
    };
  };

  const results = calculateSensitivity();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Powder Temp Sensitivity Engine</Text>
      <Text style={styles.sub}>
        Log velocity data across different seasonal temperatures to build your powder's temperature profile ($C_T$).
      </Text>

      {/* Session Logs List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>CHRONOGRAPH SESSIONS LOGGED</Text>
        
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1 }]}>TEMP (°F)</Text>
          <Text style={[styles.th, { flex: 1 }]}>VELOCITY (FPS)</Text>
          <Text style={[styles.th, { width: 50 }]}>ACTION</Text>
        </View>

        {logs.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.td, { flex: 1 }]}>{item.tempF}°F</Text>
            <Text style={[styles.td, { flex: 1 }]}>{item.velocityFps} fps</Text>
            <TouchableOpacity
              style={{ width: 50 }}
              onPress={() => removeLog(item.id)}
            >
              <Text style={styles.removeText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add New Session Form */}
        <View style={styles.addForm}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 6 }]}
            placeholder="Temp °F"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={newTemp}
            onChangeText={setNewTemp}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 6 }]}
            placeholder="Velocity FPS"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={newVel}
            onChangeText={setNewVel}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addLog}>
            <Text style={styles.addBtnText}>+ ADD</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calculated Results Engine */}
      {results && (
        <>
          {/* Stability Metric Header */}
          <View style={[styles.card, { borderColor: results.ratingColor, borderWidth: 1.5 }]}>
            <View style={styles.resultHeaderRow}>
              <View>
                <Text style={styles.metricLabel}>TEMPERATURE COEFFICIENT (C_T)</Text>
                <Text style={styles.metricValue}>
                  {results.ct} <Text style={styles.metricUnit}>fps / °F</Text>
                </Text>
              </View>

              <View style={[styles.ratingBadge, { backgroundColor: results.ratingColor }]}>
                <Text style={styles.ratingText}>{results.stabilityRating}</Text>
              </View>
            </View>

            <Text style={styles.insightText}>
              A temperature swing of <Text style={styles.highlight}>50°F</Text> will shift your muzzle velocity by ~<Text style={styles.highlight}>{(Math.abs(parseFloat(results.ct)) * 50).toFixed(0)} fps</Text>.
            </Text>
          </View>

          {/* Seasonal Prediction Table */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>PREDICTED FIELD VELOCITIES</Text>
            <Text style={styles.subText}>
              Extrapolated muzzle velocity matrix based on linear regression profile:
            </Text>

            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1 }]}>TEMP (°F)</Text>
              <Text style={[styles.th, { flex: 1 }]}>EST. VELOCITY</Text>
              <Text style={[styles.th, { flex: 1 }]}>SHIFT VS 70°F</Text>
            </View>

            {results.predictions.map((p, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  p.temp === 70 && styles.standardTempRow,
                ]}
              >
                <Text style={[styles.td, { flex: 1 }, p.temp === 70 && styles.standardTempText]}>
                  {p.temp}°F
                </Text>
                <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>
                  {p.predictedFps} fps
                </Text>
                <Text
                  style={[
                    styles.td,
                    { flex: 1 },
                    p.deltaFps > 0 ? styles.valRed : p.deltaFps < 0 ? styles.valBlue : styles.valGreen,
                  ]}
                >
                  {p.deltaFps > 0 ? `+${p.deltaFps}` : p.deltaFps} fps
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16 },
  header: { fontSize: 18, fontWeight: '900', color: '#10b981' },
  sub: { color: '#94a3b8', fontSize: 11, marginBottom: 16, marginTop: 2 },
  card: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#10b981', fontSize: 11, fontWeight: '900', marginBottom: 8 },
  subText: { color: '#64748b', fontSize: 10, marginBottom: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#334155', pb: 6, marginBottom: 6 },
  th: { color: '#64748b', fontSize: 9, fontWeight: '800' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#33415511', alignItems: 'center' },
  td: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  removeText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },
  addForm: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#334155', fontSize: 12 },
  addBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6 },
  addBtnText: { color: '#0f172a', fontWeight: '900', fontSize: 11 },
  resultHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  metricLabel: { color: '#64748b', fontSize: 9, fontWeight: '800' },
  metricValue: { color: '#f8fafc', fontSize: 24, fontWeight: '900', marginTop: 2 },
  metricUnit: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  ratingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  ratingText: { color: '#0f172a', fontSize: 9, fontWeight: '900' },
  insightText: { color: '#cbd5e1', fontSize: 11, lineHeight: 16, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 8 },
  highlight: { color: '#38bdf8', fontWeight: '800' },
  standardTempRow: { backgroundColor: '#064e3b33' },
  standardTempText: { color: '#10b981', fontWeight: '900' },
  valRed: { color: '#ef4444', fontWeight: '800' },
  valBlue: { color: '#38bdf8', fontWeight: '800' },
  valGreen: { color: '#10b981', fontWeight: '800' },
});