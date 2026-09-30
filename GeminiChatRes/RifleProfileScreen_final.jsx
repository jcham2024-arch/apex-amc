import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  exportDatabaseToJson,
  importDatabaseFromJson,
  exportChronoLogsToCsv,
  importChronoLogsFromCsv,
} from '../services/backupService';

export default function BackupRestoreScreen({ selectedRifleId = 1 }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (actionFn, successMessage) => {
    setLoading(true);
    const result = await actionFn();
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', successMessage);
    } else if (result.error) {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>DATA EXPORT & BACKUP</Text>
      <Text style={styles.sub}>
        Manage offline SQLite database dumps or export individual tables for spreadsheet analysis.
      </Text>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#10b981" />
          <Text style={styles.loadingText}>Processing data file...</Text>
        </View>
      )}

      {/* JSON Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>FULL SYSTEM BACKUP (JSON)</Text>
        <Text style={styles.cardDesc}>
          Exports all rifles, velocity entries, and target metrics into a single restore file.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            handleAction(exportDatabaseToJson, 'Database exported and ready to share.')
          }
        >
          <Text style={styles.btnText}>Export Full JSON Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() =>
            handleAction(
              importDatabaseFromJson,
              'JSON backup restored to SQLite successfully.'
            )
          }
        >
          <Text style={styles.secondaryBtnText}>Import & Restore JSON File</Text>
        </TouchableOpacity>
      </View>

      {/* CSV Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>SPREADSHEET EXPORT (CSV)</Text>
        <Text style={styles.cardDesc}>
          Export chronograph logs to standard CSV format or bulk import external shot velocities.
        </Text>

        <TouchableOpacity
          style={styles.accentBtn}
          onPress={() =>
            handleAction(exportChronoLogsToCsv, 'Chronograph CSV exported successfully.')
          }
        >
          <Text style={styles.btnText}>Export Chrono Logs (CSV)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() =>
            handleAction(
              () => importChronoLogsFromCsv(selectedRifleId),
              'CSV rows inserted into active rifle profile.'
            )
          }
        >
          <Text style={styles.secondaryBtnText}>Import CSV Chrono Rows</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  header: { fontSize: 16, fontWeight: '900', color: '#10b981' },
  sub: { color: '#94a3b8', fontSize: 11, marginBottom: 16, marginTop: 2 },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    gap: 10,
  },
  loadingText: { color: '#f8fafc', fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: { color: '#64748b', fontSize: 9, fontWeight: '900', marginBottom: 4 },
  cardDesc: { color: '#cbd5e1', fontSize: 11, marginBottom: 12 },
  primaryBtn: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  accentBtn: {
    backgroundColor: '#38bdf8',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryBtn: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnText: { color: '#0f172a', fontSize: 11, fontWeight: '900' },
  secondaryBtnText: { color: '#cbd5e1', fontSize: 11, fontWeight: '800' },
});