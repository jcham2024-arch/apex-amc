import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useBallisticsDb } from '../hooks/useBallisticsDb';

export default function RifleProfileScreen() {
  const {
    isReady,
    rifles,
    selectedRifleId,
    setSelectedRifleId,
    chronoLogs,
    shotGroups,
    createRifle,
    logChrono,
  } = useBallisticsDb();

  const [newRifleName, setNewRifleName] = useState('');
  const [newCaliber, setNewCaliber] = useState('');
  
  const [tempInput, setTempInput] = useState('72');
  const [fpsInput, setFpsInput] = useState('2680');

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Initializing SQLite Database...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Rifle Selector Header */}
      <Text style={styles.sectionHeader}>SELECT RIFLE PROFILE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
        {rifles.map((rifle) => (
          <TouchableOpacity
            key={rifle.id}
            style={[styles.rifleChip, selectedRifleId === rifle.id && styles.activeChip]}
            onPress={() => setSelectedRifleId(rifle.id)}
          >
            <Text style={[styles.chipText, selectedRifleId === rifle.id && styles.activeChipText]}>
              {rifle.name} ({rifle.caliber})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Rifle Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>CREATE NEW RIFLE</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Rifle Name (e.g. Tikka T3x)"
            placeholderTextColor="#64748b"
            value={newRifleName}
            onChangeText={setNewRifleName}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Caliber"
            placeholderTextColor="#64748b"
            value={newCaliber}
            onChangeText={setNewCaliber}
          />
        </View>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            if (newRifleName && newCaliber) {
              createRifle(newRifleName, newCaliber, 100);
              setNewRifleName('');
              setNewCaliber('');
            }
          }}
        >
          <Text style={styles.btnText}>Save Rifle Profile</Text>
        </TouchableOpacity>
      </View>

      {selectedRifleId && (
        <>
          {/* Quick Chronograph Logger */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>LOG CHRONOGRAPH DATA</Text>
            <View style={styles.row}>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>TEMP (°F)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={tempInput}
                  onChangeText={setTempInput}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>VELOCITY (FPS)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={fpsInput}
                  onChangeText={setFpsInput}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.accentBtn}
              onPress={() => {
                logChrono(parseFloat(tempInput), parseFloat(fpsInput), 'H4350');
              }}
            >
              <Text style={styles.btnText}>Log Shot to SQLite</Text>
            </TouchableOpacity>
          </View>

          {/* Stored Chrono Logs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>PERSISTED CHRONO HISTORY ({chronoLogs.length})</Text>
            {chronoLogs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Text style={styles.logText}>
                  {log.velocity_fps} FPS @ {log.temp_f}°F
                </Text>
                <Text style={styles.dateText}>{log.created_at.split(' ')[0]}</Text>
              </View>
            ))}
          </View>

          {/* Stored Group Logs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>SAVED RAYLEIGH GROUPS ({shotGroups.length})</Text>
            {shotGroups.map((group) => (
              <View key={group.id} style={styles.logRow}>
                <Text style={styles.logText}>
                  {group.shot_count} shots @ {group.distance_yd}yd — CEP50: {group.cep_50_inches}"
                </Text>
                <Text style={styles.dateText}>ES: {group.extreme_spread_inches}"</Text>
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
  content: { padding: 14 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 10, fontSize: 12, fontWeight: '700' },
  sectionHeader: { color: '#10b981', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  pickerRow: { flexDirection: 'row', marginBottom: 14 },
  rifleChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeChip: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { color: '#94a3b8', fontSize: 11, fontWeight: '800' },
  activeChipText: { color: '#0f172a' },
  card: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: { color: '#64748b', fontSize: 9, fontWeight: '900', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  inputWrap: { flex: 1 },
  label: { color: '#94a3b8', fontSize: 8, fontWeight: '800', marginBottom: 2 },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 12,
  },
  primaryBtn: {
    backgroundColor: '#334155',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  accentBtn: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#f8fafc', fontSize: 11, fontWeight: '800' },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#33415544',
  },
  logText: { color: '#f8fafc', fontSize: 11, fontWeight: '700' },
  dateText: { color: '#64748b', fontSize: 10 },
});