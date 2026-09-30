import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function DopeCardScreen() {
  const [clickUnit, setClickUnit] = useState('MIL'); // 'MIL' or 'MOA'

  // Standard DOPE Table Data Generator
  const generateDopeRows = () => {
    const rows = [];
    const step = 100;
    for (let yd = 100; yd <= 1000; yd += step) {
      const dropInches = 0.00008 * Math.pow(yd, 2.3);
      const elevationHold = clickUnit === 'MIL' 
        ? (dropInches / (yd * 0.036)).toFixed(1)
        : (dropInches / (yd * 0.01047)).toFixed(1);
      
      const windHold = clickUnit === 'MIL'
        ? (yd * 0.0018).toFixed(1)
        : (yd * 0.0052).toFixed(1);

      rows.push({
        yd,
        elevation: elevationHold,
        wind: windHold,
        timeMs: Math.round(110 + yd * 1.45),
        isTransonic: yd >= 900,
      });
    }
    return rows;
  };

  const dopeRows = generateDopeRows();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Scope Header Info */}
      <View style={styles.headerCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>MV: <Text style={styles.boldVal}>2,720 fps</Text></Text>
          <Text style={styles.infoText}>DA: <Text style={styles.boldVal}>4,200 ft</Text></Text>
          <Text style={styles.infoText}>ZERO: <Text style={styles.boldVal}>100 yd</Text></Text>
        </View>

        {/* MIL / MOA Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleBtn, clickUnit === 'MIL' && styles.activeToggle]}
            onPress={() => setClickUnit('MIL')}
          >
            <Text style={[styles.toggleText, clickUnit === 'MIL' && styles.activeToggleText]}>MIL (0.1)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, clickUnit === 'MOA' && styles.activeToggle]}
            onPress={() => setClickUnit('MOA')}
          >
            <Text style={[styles.toggleText, clickUnit === 'MOA' && styles.activeToggleText]}>MOA (1/4)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DOPE Table */}
      <View style={styles.tableCard}>
        <View style={styles.thRow}>
          <Text style={[styles.th, { flex: 1 }]}>DIST (YD)</Text>
          <Text style={[styles.th, { flex: 1 }]}>ELEV ({clickUnit})</Text>
          <Text style={[styles.th, { flex: 1 }]}>WIND 10MPH</Text>
          <Text style={[styles.th, { flex: 1 }]}>TIME (MS)</Text>
        </View>

        {dopeRows.map((row) => (
          <View key={row.yd} style={[styles.trRow, row.isTransonic && styles.transonicRow]}>
            <Text style={[styles.td, { flex: 1, fontWeight: '800' }]}>{row.yd}</Text>
            <Text style={[styles.tdVal, { flex: 1 }]}>{row.elevation}</Text>
            <Text style={[styles.td, { flex: 1 }]}>{row.wind}</Text>
            <Text style={[styles.tdSub, { flex: 1 }]}>{row.timeMs} ms</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  headerCard: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoText: { color: '#64748b', fontSize: 10, fontWeight: '800' },
  boldVal: { color: '#f8fafc', fontWeight: '900' },
  toggleRow: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 6, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 4 },
  activeToggle: { backgroundColor: '#10b981' },
  toggleText: { color: '#64748b', fontSize: 10, fontWeight: '800' },
  activeToggleText: { color: '#0f172a' },
  tableCard: { backgroundColor: '#1e293b', borderRadius: 8, borderWidth: 1, borderColor: '#334155', padding: 10 },
  thRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 8, marginBottom: 4 },
  th: { color: '#64748b', fontSize: 8, fontWeight: '900' },
  trRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#33415522', alignItems: 'center' },
  td: { color: '#f8fafc', fontSize: 12 },
  tdVal: { color: '#38bdf8', fontSize: 13, fontWeight: '900' },
  tdSub: { color: '#64748b', fontSize: 11 },
  transonicRow: { backgroundColor: '#ef444411' },
});