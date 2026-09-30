import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { exportDatabaseToJson, importDatabaseFromJson, exportChronoLogsToCsv } from '../services/backupService';

export default function BackupRestoreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>BACKUP & RESTORE</Text>

      <View style={styles.card}>
        <TouchableOpacity style={styles.btn} onPress={async () => { const res = await exportDatabaseToJson(); if (res.success) Alert.alert('Exported!'); }}>
          <Text style={styles.btnText}>Export JSON Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { marginTop: 8 }]} onPress={async () => { const res = await importDatabaseFromJson(); if (res.success) Alert.alert('Restored!'); }}>
          <Text style={styles.btnText}>Import JSON Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { marginTop: 8, backgroundColor: '#38bdf8' }]} onPress={async () => { const res = await exportChronoLogsToCsv(); if (res.success) Alert.alert('Exported CSV!'); }}>
          <Text style={styles.btnText}>Export Chrono CSV</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  header: { fontSize: 16, fontWeight: '900', color: '#10b981', marginBottom: 12 },
  card: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  btn: { backgroundColor: '#10b981', padding: 10, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#0f172a', fontWeight: '900', fontSize: 12 },
});
