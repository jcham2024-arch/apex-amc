import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * CSV cell encoding.
 *
 * SECURITY — two distinct issues, both fixed here:
 *
 * 1. Formula injection. A value beginning with `=`, `+`, `-`, `@`, TAB or
 *    CR is executed as a formula when the file is opened in Excel, LibreOffice
 *    or Sheets. A rifle or retailer name containing a leading `-` would run.
 *    Prefixing with an apostrophe forces text.
 *
 * 2. Delimiter injection. A value containing a comma, quote or newline breaks
 *    the column structure and can forge extra columns. Every field is quoted
 *    and embedded quotes doubled, per RFC 4180.
 */
const csvCell = (value) => {
  const raw = value === null || value === undefined ? '' : String(value);

  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
};

const csvRow = (cells) => cells.map(csvCell).join(',');

const downloadWebFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Restrict a filename to a safe subset.
 *
 * Path separators and `..` in a generated or caller-supplied name let an
 * attacker steer the download somewhere unintended.
 */
const safeFilename = (name) => {
  const cleaned = String(name)
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : 'download';
};

/**
 * Backup file parsing and validation.
 *
 * SECURITY — a backup file is untrusted input: it is chosen by the user and
 * can be hand-edited. `JSON.parse` alone is not enough.
 *
 * Prototype pollution: `{"__proto__": {...}}` and `{"constructor": {...}}`
 * are legitimate JSON keys. If such a payload is later spread or merged into
 * another object it can reach `Object.prototype`. We strip those keys at parse
 * time.
 *
 * Type confusion: an array of strings, or a number where an object belongs,
 * would otherwise reach SQLite as `[object Object]` or abort the import
 * halfway. Every field is coerced and range-checked here, so a bad file is
 * rejected before anything is written.
 */

/** Keys that must never survive parsing. */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Strip prototype-pollution vectors recursively. */
const stripDangerousKeys = (value, depth = 0) => {
  if (depth > 12 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => stripDangerousKeys(v, depth + 1));

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(k)) continue;
    out[k] = stripDangerousKeys(v, depth + 1);
  }
  return out;
};

const asFiniteNumber = (v, fallback = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const asString = (v, fallback = '') => (typeof v === 'string' ? v : fallback);

/** Coerce one record into the exact shape the insert statements expect. */
const coerceRifle = (raw) => ({
  id: asFiniteNumber(raw.id, Date.now()),
  name: asString(raw.name),
  caliber: asString(raw.caliber),
  zeroDistanceYd: asFiniteNumber(raw.zero_distance_yd, 100),
  createdAt: asString(raw.created_at),
});

const coerceChronoLog = (raw) => ({
  id: asFiniteNumber(raw.id, Date.now()),
  rifleId: asFiniteNumber(raw.rifle_id),
  tempF: asFiniteNumber(raw.temp_f),
  velocityFps: asFiniteNumber(raw.velocity_fps),
  powderName: asString(raw.powder_name),
  createdAt: asString(raw.created_at),
});

const coerceShotGroup = (raw) => ({
  id: asFiniteNumber(raw.id, Date.now()),
  rifleId: asFiniteNumber(raw.rifle_id),
  distanceYd: asFiniteNumber(raw.distance_yd),
  cep50: asFiniteNumber(raw.cep_50_inches),
  extremeSpread: asFiniteNumber(raw.extreme_spread_inches),
  shotCount: asFiniteNumber(raw.shot_count),
});

/** Cap record count so a hostile file cannot exhaust memory. */
const MAX_RECORDS = 50000;

const coerceList = (list, coerce, label) => {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) throw new Error(`Invalid backup: ${label} must be an array.`);
  if (list.length > MAX_RECORDS) {
    throw new Error(`Invalid backup: ${label} exceeds ${MAX_RECORDS} records.`);
  }
  return list.filter((r) => r !== null && typeof r === 'object').map(coerce);
};

/**
 * Parse and validate a backup file.
 * @returns {{rifles: object[], chronograph_logs: object[], shot_groups: object[]}}
 * @throws {Error} if the payload is not a recognisable backup.
 */
const parseBackupJson = (jsonString) => {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid backup: file is not valid JSON.');
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid backup: expected a JSON object.');
  }
  if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    throw new Error('Invalid backup: missing "data" object.');
  }
  if (!Array.isArray(parsed.data.rifles)) {
    throw new Error('Invalid backup: "data.rifles" must be an array.');
  }

  const safe = stripDangerousKeys(parsed.data);

  return {
    rifles: coerceList(safe.rifles, coerceRifle, 'rifles'),
    chronograph_logs: coerceList(safe.chronograph_logs, coerceChronoLog, 'chronograph_logs'),
    shot_groups: coerceList(safe.shot_groups, coerceShotGroup, 'shot_groups'),
  };
};


const pickWebFile = (acceptType) => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptType;
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) resolve(null);
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.readAsText(file);
    };
    input.click();
  });
};

export const exportDatabaseToJson = async () => {
  try {
    let rifles = [], chronoLogs = [], shotGroups = [];

    if (isWeb) {
      rifles = JSON.parse(localStorage.getItem('apex_amc_rifles')) || [];
      chronoLogs = JSON.parse(localStorage.getItem('apex_amc_chronograph_logs')) || [];
      shotGroups = JSON.parse(localStorage.getItem('apex_amc_shot_groups')) || [];
    } else {
      const SQLite = require('expo-sqlite');
      const db = await SQLite.openDatabaseAsync('ballistics.db');
      rifles = await db.getAllAsync('SELECT * FROM rifles;');
      chronoLogs = await db.getAllAsync('SELECT * FROM chronograph_logs;');
      shotGroups = await db.getAllAsync('SELECT * FROM shot_groups;');
    }

    const backupData = { version: 1, exportedAt: new Date().toISOString(), data: { rifles, chronograph_logs: chronoLogs, shot_groups: shotGroups } };
    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `ballistics_backup_${Date.now()}.json`;

    if (isWeb) {
      downloadWebFile(jsonString, filename, 'application/json');
      return { success: true };
    }

    const FileSystem = require('expo-file-system');
    const Sharing = require('expo-sharing');
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

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
    let jsonString = '';

    if (isWeb) {
      jsonString = await pickWebFile('.json,application/json');
      if (!jsonString) return { success: false, message: 'Cancelled' };
    } else {
      const DocumentPicker = require('expo-document-picker');
      const FileSystem = require('expo-file-system');

      const pickerResult = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (pickerResult.canceled) return { success: false, message: 'Cancelled' };

      const selectedFile = pickerResult.assets[0];
      jsonString = await FileSystem.readAsStringAsync(selectedFile.uri, { encoding: FileSystem.EncodingType.UTF8 });
    }

    const backupData = parseBackupJson(jsonString);
    const { rifles, chronograph_logs: chronoLogs, shot_groups: groups } = backupData;

    if (isWeb) {
      localStorage.setItem('apex_amc_rifles', JSON.stringify(rifles));
      localStorage.setItem('apex_amc_chronograph_logs', JSON.stringify(chronoLogs));
      localStorage.setItem('apex_amc_shot_groups', JSON.stringify(groups));
      return { success: true };
    }

    const SQLite = require('expo-sqlite');
    const db = await SQLite.openDatabaseAsync('ballistics.db');

    await db.withTransactionAsync(async () => {
      for (const r of rifles) {
        await db.runAsync('INSERT OR REPLACE INTO rifles (id, name, caliber, zero_distance_yd, created_at) VALUES (?, ?, ?, ?, ?);', [r.id, r.name, r.caliber, r.zero_distanceYd, r.createdAt]);
      }
      for (const c of chronoLogs) {
        await db.runAsync('INSERT OR REPLACE INTO chronograph_logs (id, rifle_id, temp_f, velocity_fps, powder_name, created_at) VALUES (?, ?, ?, ?, ?, ?);', [c.id, c.rifleId, c.tempF, c.velocityFps, c.powderName, c.createdAt]);
      }
      for (const g of groups) {
        await db.runAsync('INSERT OR REPLACE INTO shot_groups (id, rifle_id, distance_yd, cep_50_inches, extreme_spread_inches, shot_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);', [g.id, g.rifleId, g.distanceYd, g.cep50, g.extremeSpread, g.shotCount, g.createdAt]);
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const exportChronoLogsToCsv = async () => {
  try {
    let rows = [];

    if (isWeb) {
      const rifles = JSON.parse(localStorage.getItem('apex_amc_rifles')) || [];
      const logs = JSON.parse(localStorage.getItem('apex_amc_chronograph_logs')) || [];
      rows = logs.map((log) => {
        const rifle = rifles.find((r) => r.id === log.rifle_id);
        return { ...log, rifle_name: rifle ? rifle.name : 'Unknown Rifle' };
      });
    } else {
      const SQLite = require('expo-sqlite');
      const db = await SQLite.openDatabaseAsync('ballistics.db');
      rows = await db.getAllAsync(`
        SELECT c.id, r.name AS rifle_name, c.temp_f, c.velocity_fps, c.powder_name, c.created_at 
        FROM chronograph_logs c 
        JOIN rifles r ON c.rifle_id = r.id 
        ORDER BY c.created_at DESC;
      `);
    }

    const headers = ['ID', 'Rifle Name', 'Temp (F)', 'Velocity (FPS)', 'Powder Name', 'Logged At'];
    const csvLines = [csvRow(headers)];

    rows.forEach((row) => {
      // Every cell goes through csvCell: a rifle named `-2` or a powder name
      // containing a comma would otherwise execute or forge columns.
      csvLines.push(csvRow([
        row.id,
        row.rifle_name,
        row.temp_f,
        row.velocity_fps,
        row.powder_name,
        row.created_at,
      ]));
    });

    const csvString = csvLines.join('\r\n');
    const filename = safeFilename(`chronograph_logs_${Date.now()}.csv`);

    if (isWeb) {
      downloadWebFile(csvString, filename, 'text/csv');
      return { success: true };
    }

    const FileSystem = require('expo-file-system');
    const Sharing = require('expo-sharing');
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

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
    let csvString = '';

    if (isWeb) {
      csvString = await pickWebFile('.csv,text/csv,text/plain');
      if (!csvString) return { success: false, message: 'Cancelled' };
    } else {
      const DocumentPicker = require('expo-document-picker');
      const FileSystem = require('expo-file-system');

      const pickerResult = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'text/plain'], copyToCacheDirectory: true });
      if (pickerResult.canceled) return { success: false, message: 'Cancelled' };

      const fileUri = pickerResult.assets[0].uri;
      csvString = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
    }

    const lines = csvString.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) throw new Error('CSV file is empty or missing data rows.');

    if (isWeb) {
      const logs = JSON.parse(localStorage.getItem('apex_amc_chronograph_logs')) || [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((col) => col.replace(/^"|"$/g, '').trim());
        if (cols.length >= 4) {
          const tempF = parseFloat(cols[2]) || 70;
          const velocityFps = parseFloat(cols[3]) || 0;
          const powderName = cols[4] || 'CSV Import';

          if (velocityFps > 0) {
            logs.push({ id: Date.now() + i, rifle_id: targetRifleId, temp_f: tempF, velocity_fps: velocityFps, powder_name: powderName, created_at: new Date().toISOString() });
          }
        }
      }
      localStorage.setItem('apex_amc_chronograph_logs', JSON.stringify(logs));
      return { success: true };
    }

    const SQLite = require('expo-sqlite');
    const db = await SQLite.openDatabaseAsync('ballistics.db');

    await db.withTransactionAsync(async () => {
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((col) => col.replace(/^"|"$/g, '').trim());
        if (cols.length >= 4) {
          const tempF = parseFloat(cols[2]) || 70;
          const velocityFps = parseFloat(cols[3]) || 0;
          const powderName = cols[4] || 'CSV Import';

          if (velocityFps > 0) {
            await db.runAsync('INSERT INTO chronograph_logs (rifle_id, temp_f, velocity_fps, powder_name) VALUES (?, ?, ?, ?);', [targetRifleId, tempF, velocityFps, powderName]);
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};