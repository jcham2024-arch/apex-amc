import os
import json
import subprocess
import sys

# Operates directly inside ApexProject
PROJECT_DIR = os.getcwd()

# Baseline package.json (includes Expo SDK + overrides block)
PACKAGE_JSON = {
    "name": "apex-ballistics",
    "version": "1.0.0",
    "main": "node_modules/expo/AppEntry.js",
    "scripts": {
        "start": "expo start",
        "android": "expo start --android",
        "ios": "expo start --ios",
        "web": "expo start --web"
    },
    "dependencies": {
        "expo": "~51.0.0",
        "expo-status-bar": "~1.12.1",
        "react": "18.2.0",
        "react-native": "0.74.5"
    },
    "devDependencies": {
        "@babel/core": "^7.20.0"
    },
    "private": True,
    "overrides": {
        "uuid": "^11.1.1"
    }
}

FILES = {
    "App.jsx": '''import React from 'react';
import { StatusBar, StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import PowderTempSensitivityScreen from './screens/PowderTempSensitivityScreen';
import RayleighGroupCalculator from './screens/RayleighGroupCalculator';
import TransonicStabilityScreen from './screens/TransonicStabilityScreen';
import DopeCardScreen from './screens/DopeCardScreen';
import RifleProfileScreen from './screens/RifleProfileScreen';
import BackupRestoreScreen from './screens/BackupRestoreScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }) => {
  const icons = {
    'DOPE': '🎯',
    'Powder C_T': '🌡️',
    'CEP Metrics': '📊',
    'Transonic': '⚡',
    'Rifles': '🔫',
    'Backup': '💾',
  };
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, focused && styles.iconFocused]}>
        {icons[name] || '📍'}
      </Text>
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: '#0f172a', elevation: 0, shadowOpacity: 0 },
          headerTitleStyle: { color: '#10b981', fontWeight: '900', fontSize: 16 },
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen name="DOPE" component={DopeCardScreen} options={{ title: 'DOPE CARD' }} />
        <Tab.Screen name="Powder C_T" component={PowderTempSensitivityScreen} options={{ title: 'POWDER C_T' }} />
        <Tab.Screen name="CEP Metrics" component={RayleighGroupCalculator} options={{ title: 'CEP METRICS' }} />
        <Tab.Screen name="Transonic" component={TransonicStabilityScreen} options={{ title: 'TRANSONIC / SG' }} />
        <Tab.Screen name="Rifles" component={RifleProfileScreen} options={{ title: 'RIFLE PROFILES' }} />
        <Tab.Screen name="Backup" component={BackupRestoreScreen} options={{ title: 'DATA BACKUP' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: { fontSize: 10, fontWeight: '800' },
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 16, opacity: 0.6 },
  iconFocused: { opacity: 1.0, transform: [{ scale: 1.15 }] },
});
''',

    os.path.join("services", "database.js"): '''import * as SQLite from 'expo-sqlite';

let db;

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('ballistics.db');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS rifles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      caliber TEXT NOT NULL,
      zero_distance_yd REAL DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chronograph_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rifle_id INTEGER NOT NULL,
      temp_f REAL NOT NULL,
      velocity_fps REAL NOT NULL,
      powder_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rifle_id) REFERENCES rifles (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shot_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rifle_id INTEGER NOT NULL,
      distance_yd REAL NOT NULL,
      cep_50_inches REAL NOT NULL,
      extreme_spread_inches REAL NOT NULL,
      shot_count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rifle_id) REFERENCES rifles (id) ON DELETE CASCADE
    );
  `);
};

export const getRifles = async () => {
  return await db.getAllAsync('SELECT * FROM rifles ORDER BY id DESC;');
};

export const addRifle = async (name, caliber, zeroDistanceYd = 100) => {
  const result = await db.runAsync(
    'INSERT INTO rifles (name, caliber, zero_distance_yd) VALUES (?, ?, ?);',
    [name, caliber, zeroDistanceYd]
  );
  return result.lastInsertRowId;
};

export const addChronoLog = async (rifleId, tempF, velocityFps, powderName = '') => {
  const result = await db.runAsync(
    'INSERT INTO chronograph_logs (rifle_id, temp_f, velocity_fps, powder_name) VALUES (?, ?, ?, ?);',
    [rifleId, tempF, velocityFps, powderName]
  );
  return result.lastInsertRowId;
};

export const getChronoLogsByRifle = async (rifleId) => {
  return await db.getAllAsync(
    'SELECT * FROM chronograph_logs WHERE rifle_id = ? ORDER BY created_at DESC;',
    [rifleId]
  );
};

export const addShotGroup = async (rifleId, distanceYd, cep50, extremeSpread, shotCount) => {
  const result = await db.runAsync(
    `INSERT INTO shot_groups (rifle_id, distance_yd, cep_50_inches, extreme_spread_inches, shot_count) 
     VALUES (?, ?, ?, ?, ?);`,
    [rifleId, distanceYd, cep50, extremeSpread, shotCount]
  );
  return result.lastInsertRowId;
};

export const getShotGroupsByRifle = async (rifleId) => {
  return await db.getAllAsync(
    'SELECT * FROM shot_groups WHERE rifle_id = ? ORDER BY created_at DESC;',
    [rifleId]
  );
};
''',

    os.path.join("services", "backupService.js"): '''import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';

const getDb = async () => await SQLite.openDatabaseAsync('ballistics.db');

export const exportDatabaseToJson = async () => {
  try {
    const db = await getDb();
    const rifles = await db.getAllAsync('SELECT * FROM rifles;');
    const chronoLogs = await db.getAllAsync('SELECT * FROM chronograph_logs;');
    const shotGroups = await db.getAllAsync('SELECT * FROM shot_groups;');

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { rifles, chronograph_logs: chronoLogs, shot_groups: shotGroups },
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileUri = `${FileSystem.documentDirectory}ballistics_backup_${Date.now()}.json`;

    await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Ballistics JSON Backup' });
    }
    return { success: true, fileUri };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const importDatabaseFromJson = async () => {
  try {
    const pickerResult = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (pickerResult.canceled) return { success: false, message: 'Cancelled' };

    const selectedFile = pickerResult.assets[0];
    const jsonString = await FileSystem.readAsStringAsync(selectedFile.uri, { encoding: FileSystem.EncodingType.UTF8 });
    const backupData = JSON.parse(jsonString);

    if (!backupData.data || !backupData.data.rifles) throw new Error('Invalid backup file format.');

    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const { rifles, chronograph_logs, shot_groups } = backupData.data;

      for (const r of rifles || []) {
        await db.runAsync(
          'INSERT OR REPLACE INTO rifles (id, name, caliber, zero_distance_yd, created_at) VALUES (?, ?, ?, ?, ?);',
          [r.id, r.name, r.caliber, r.zero_distance_yd, r.created_at]
        );
      }
      for (const c of chronograph_logs || []) {
        await db.runAsync(
          'INSERT OR REPLACE INTO chronograph_logs (id, rifle_id, temp_f, velocity_fps, powder_name, created_at) VALUES (?, ?, ?, ?, ?, ?);',
          [c.id, c.rifle_id, c.temp_f, c.velocity_fps, c.powder_name, c.created_at]
        );
      }
      for (const g of shot_groups || []) {
        await db.runAsync(
          'INSERT OR REPLACE INTO shot_groups (id, rifle_id, distance_yd, cep_50_inches, extreme_spread_inches, shot_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
          [g.id, g.rifle_id, g.distance_yd, g.cep_50_inches, g.extreme_spread_inches, g.shot_count, g.created_at]
        );
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const exportChronoLogsToCsv = async () => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync(`
      SELECT c.id, r.name AS rifle_name, c.temp_f, c.velocity_fps, c.powder_name, c.created_at 
      FROM chronograph_logs c 
      JOIN rifles r ON c.rifle_id = r.id 
      ORDER BY c.created_at DESC;
    `);

    const headers = ['ID', 'Rifle Name', 'Temp (F)', 'Velocity (FPS)', 'Powder Name', 'Logged At'];
    const csvLines = [headers.join(',')];

    rows.forEach((row) => {
      const line = [
        row.id,
        `"${row.rifle_name.replace(/"/g, '""')}"`,
        row.temp_f,
        row.velocity_fps,
        `"${(row.powder_name || '').replace(/"/g, '""')}"`,
        `"${row.created_at}"`,
      ].join(',');
      csvLines.push(line);
    });

    const csvString = csvLines.join('\\n');
    const fileUri = `${FileSystem.documentDirectory}chronograph_logs_${Date.now()}.csv`;

    await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Chronograph CSV' });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const importChronoLogsFromCsv = async (targetRifleId) => {
  try {
    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
      copyToCacheDirectory: true,
    });

    if (pickerResult.canceled) return { success: false, message: 'Cancelled' };

    const fileUri = pickerResult.assets[0].uri;
    const csvString = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
    const lines = csvString.split(/\\r?\\n/).filter((line) => line.trim() !== '');

    if (lines.length < 2) throw new Error('CSV file is empty or missing data rows.');

    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((col) => col.replace(/^"|"$/g, '').trim());
        if (cols.length >= 4) {
          const tempF = parseFloat(cols[2]) || 70;
          const velocityFps = parseFloat(cols[3]) || 0;
          const powderName = cols[4] || 'CSV Import';

          if (velocityFps > 0) {
            await db.runAsync(
              'INSERT INTO chronograph_logs (rifle_id, temp_f, velocity_fps, powder_name) VALUES (?, ?, ?, ?);',
              [targetRifleId, tempF, velocityFps, powderName]
            );
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
''',

    os.path.join("hooks", "useBallisticsDb.js"): '''import { useState, useEffect, useCallback } from 'react';
import {
  initDatabase,
  getRifles,
  addRifle,
  addChronoLog,
  getChronoLogsByRifle,
  addShotGroup,
  getShotGroupsByRifle,
} from '../services/database';

export function useBallisticsDb() {
  const [isReady, setIsReady] = useState(false);
  const [rifles, setRifles] = useState([]);
  const [selectedRifleId, setSelectedRifleId] = useState(null);
  const [chronoLogs, setChronoLogs] = useState([]);
  const [shotGroups, setShotGroups] = useState([]);

  useEffect(() => {
    async function setup() {
      await initDatabase();
      const loadedRifles = await getRifles();
      setRifles(loadedRifles);
      if (loadedRifles.length > 0) {
        setSelectedRifleId(loadedRifles[0].id);
      }
      setIsReady(true);
    }
    setup();
  }, []);

  const refreshRifleData = useCallback(async (rifleId) => {
    if (!rifleId) return;
    const [logs, groups] = await Promise.all([
      getChronoLogsByRifle(rifleId),
      getShotGroupsByRifle(rifleId),
    ]);
    setChronoLogs(logs);
    setShotGroups(groups);
  }, []);

  useEffect(() => {
    if (selectedRifleId) {
      refreshRifleData(selectedRifleId);
    }
  }, [selectedRifleId, refreshRifleData]);

  const handleCreateRifle = async (name, caliber, zeroDistance) => {
    const newId = await addRifle(name, caliber, zeroDistance);
    const updatedRifles = await getRifles();
    setRifles(updatedRifles);
    setSelectedRifleId(newId);
  };

  const handleLogChrono = async (tempF, velocityFps, powderName) => {
    if (!selectedRifleId) return;
    await addChronoLog(selectedRifleId, tempF, velocityFps, powderName);
    await refreshRifleData(selectedRifleId);
  };

  const handleSaveGroup = async (distanceYd, cep50, extremeSpread, shotCount) => {
    if (!selectedRifleId) return;
    await addShotGroup(selectedRifleId, distanceYd, cep50, extremeSpread, shotCount);
    await refreshRifleData(selectedRifleId);
  };

  return {
    isReady,
    rifles,
    selectedRifleId,
    setSelectedRifleId,
    chronoLogs,
    shotGroups,
    createRifle: handleCreateRifle,
    logChrono: handleLogChrono,
    saveGroup: handleSaveGroup,
  };
}
''',

    os.path.join("screens", "DopeCardScreen.jsx"): '''import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function DopeCardScreen() {
  const [clickUnit, setClickUnit] = useState('MIL');

  const generateDopeRows = () => {
    const rows = [];
    for (let yd = 100; yd <= 1000; yd += 100) {
      const dropInches = 0.00008 * Math.pow(yd, 2.3);
      const elevationHold = clickUnit === 'MIL' 
        ? (dropInches / (yd * 0.036)).toFixed(1)
        : (dropInches / (yd * 0.01047)).toFixed(1);
      
      const windHold = clickUnit === 'MIL' ? (yd * 0.0018).toFixed(1) : (yd * 0.0052).toFixed(1);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>MV: <Text style={styles.boldVal}>2,720 fps</Text></Text>
          <Text style={styles.infoText}>DA: <Text style={styles.boldVal}>4,200 ft</Text></Text>
          <Text style={styles.infoText}>ZERO: <Text style={styles.boldVal}>100 yd</Text></Text>
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleBtn, clickUnit === 'MIL' && styles.activeToggle]} onPress={() => setClickUnit('MIL')}>
            <Text style={[styles.toggleText, clickUnit === 'MIL' && styles.activeToggleText]}>MIL (0.1)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, clickUnit === 'MOA' && styles.activeToggle]} onPress={() => setClickUnit('MOA')}>
            <Text style={[styles.toggleText, clickUnit === 'MOA' && styles.activeToggleText]}>MOA (1/4)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.thRow}>
          <Text style={[styles.th, { flex: 1 }]}>DIST (YD)</Text>
          <Text style={[styles.th, { flex: 1 }]}>ELEV ({clickUnit})</Text>
          <Text style={[styles.th, { flex: 1 }]}>WIND 10MPH</Text>
          <Text style={[styles.th, { flex: 1 }]}>TIME (MS)</Text>
        </View>

        {generateDopeRows().map((row) => (
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
''',

    os.path.join("screens", "PowderTempSensitivityScreen.jsx"): '''import React, { useState } from 'react';
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
''',

    os.path.join("screens", "RayleighGroupCalculator.jsx"): '''import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';

const TARGET_SIZE = 280;
const SCALE_INCHES = 6;
const PX_PER_INCH = TARGET_SIZE / SCALE_INCHES;

export default function RayleighGroupCalculator() {
  const [shots, setShots] = useState([
    { id: '1', x: -0.45, y: 0.62 },
    { id: '2', x: 0.35, y: 0.28 },
    { id: '3', x: -0.12, y: -0.55 },
  ]);

  const handleTargetTap = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const xInches = (locationX - TARGET_SIZE / 2) / PX_PER_INCH;
    const yInches = (TARGET_SIZE / 2 - locationY) / PX_PER_INCH;

    setShots([...shots, { id: Date.now().toString(), x: xInches, y: yInches }]);
  };

  const calculateMetrics = () => {
    const n = shots.length;
    if (n < 3) return null;

    const coiX = shots.reduce((sum, s) => sum + s.x, 0) / n;
    const coiY = shots.reduce((sum, s) => sum + s.y, 0) / n;

    const radii = shots.map((s) => Math.sqrt(Math.pow(s.x - coiX, 2) + Math.pow(s.y - coiY, 2)));
    const meanRadius = radii.reduce((sum, r) => sum + r, 0) / n;

    const sumSqRadii = radii.reduce((sum, r) => sum + r * r, 0);
    const sigma = Math.sqrt(sumSqRadii / (2 * n));

    return { n, coiX, coiY, meanRadius, cep50: 1.1774 * sigma, cep90: 2.1460 * sigma };
  };

  const metrics = calculateMetrics();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Rayleigh CEP Group Calculator</Text>

      <View style={styles.targetWrapper}>
        <TouchableOpacity activeOpacity={0.9} style={styles.targetCanvas} onPress={handleTargetTap}>
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />

          {shots.map((shot, idx) => {
            const pxX = TARGET_SIZE / 2 + shot.x * PX_PER_INCH - 6;
            const pxY = TARGET_SIZE / 2 - shot.y * PX_PER_INCH - 6;
            return (
              <View key={shot.id} style={[styles.shotDot, { left: pxX, top: pxY }]}>
                <Text style={styles.shotNumber}>{idx + 1}</Text>
              </View>
            );
          })}
        </TouchableOpacity>
      </View>

      {metrics && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CEP 50% RADIUS: {metrics.cep50.toFixed(2)}"</Text>
          <Text style={styles.cardTitle}>MEAN RADIUS: {metrics.meanRadius.toFixed(2)}"</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  header: { fontSize: 16, fontWeight: '900', color: '#10b981', marginBottom: 12 },
  targetWrapper: { alignItems: 'center', marginBottom: 16 },
  targetCanvas: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  crosshairH: { position: 'absolute', width: '100%', height: 1, backgroundColor: '#334155aa', top: TARGET_SIZE / 2 },
  crosshairV: { position: 'absolute', height: '100%', width: 1, backgroundColor: '#334155aa', left: TARGET_SIZE / 2 },
  shotDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justify.content: 'center',
  },
  shotNumber: { color: '#ffffff', fontSize: 7, fontWeight: '900' },
  card: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#38bdf8', fontSize: 14, fontWeight: '900', marginBottom: 4 },
});
''',

    os.path.join("screens", "TransonicStabilityScreen.jsx"): '''import React, { useState } from 'react';
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
''',

    os.path.join("screens", "RifleProfileScreen.jsx"): '''import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useBallisticsDb } from '../hooks/useBallisticsDb';

export default function RifleProfileScreen() {
  const { isReady, createRifle } = useBallisticsDb();
  const [name, setName] = useState('');
  const [caliber, setCaliber] = useState('');

  if (!isReady) return <ActivityIndicator size="large" color="#10b981" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.cardTitle}>RIFLE PROFILES</Text>
      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Rifle Name" placeholderTextColor="#64748b" value={name} onChangeText={setName} />
        <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Caliber" placeholderTextColor="#64748b" value={caliber} onChangeText={setCaliber} />
        <TouchableOpacity style={styles.btn} onPress={() => { createRifle(name, caliber); setName(''); setCaliber(''); }}>
          <Text style={styles.btnText}>Add Rifle</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 14 },
  card: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#10b981', fontSize: 12, fontWeight: '900', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#334155', fontSize: 12 },
  btn: { backgroundColor: '#10b981', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#0f172a', fontWeight: '900', fontSize: 12 },
});
''',

    os.path.join("screens", "BackupRestoreScreen.jsx"): '''import React from 'react';
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
'''
}

def run_cmd(command, cwd=None):
    print(f"\n--> Executing: {command}")
    res = subprocess.run(command, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"!!! Error running command: {command}")

def main():
    print(f"=== Setting up project inside directory: {PROJECT_DIR} ===")

    # Create directories
    for folder in ["screens", "services", "hooks"]:
        os.makedirs(os.path.join(PROJECT_DIR, folder), exist_ok=True)

    # Write package.json
    pkg_json_path = os.path.join(PROJECT_DIR, "package.json")
    print("Writing package.json...")
    with open(pkg_json_path, "w", encoding="utf-8") as f:
        json.dump(PACKAGE_JSON, f, indent=2)

    # Write source files
    print("Writing React Native components...")
    for rel_path, content in FILES.items():
        full_path = os.path.join(PROJECT_DIR, rel_path)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

    # Install dependencies
    print("Installing npm dependencies...")
    run_cmd(
        'npm install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context expo-sqlite expo-file-system expo-sharing expo-document-picker',
        cwd=PROJECT_DIR
    )

    print("\n========================================================")
    print("SUCCESS: Setup Complete!")
    print("Start your app with:")
    print("npx expo start")
    print("========================================================")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nError encountered: {e}")
    finally:
        # Prevents window auto-closing on completion or failure
        input("\nPress ENTER to exit...")