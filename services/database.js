import { Platform } from 'react-native';

let db = null;
const isWeb = Platform.OS === 'web';

const getWebStore = (key) => {
  try {
    return JSON.parse(localStorage.getItem(`apex_amc_${key}`)) || [];
  } catch (e) {
    return [];
  }
};

const setWebStore = (key, data) => {
  try {
    localStorage.setItem(`apex_amc_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const initDatabase = async () => {
  if (isWeb) {
    if (!localStorage.getItem('apex_amc_rifles')) setWebStore('rifles', []);
    if (!localStorage.getItem('apex_amc_chronograph_logs')) setWebStore('chronograph_logs', []);
    if (!localStorage.getItem('apex_amc_shot_groups')) setWebStore('shot_groups', []);
    return;
  }

  // Dynamic require prevents Metro from bundling expo-sqlite on web targets
  const SQLite = require('expo-sqlite');
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
  if (isWeb) return getWebStore('rifles').sort((a, b) => b.id - a.id);
  return await db.getAllAsync('SELECT * FROM rifles ORDER BY id DESC;');
};

export const addRifle = async (name, caliber, zeroDistanceYd = 100) => {
  if (isWeb) {
    const rifles = getWebStore('rifles');
    const newRifle = { id: Date.now(), name, caliber, zero_distance_yd: zeroDistanceYd, created_at: new Date().toISOString() };
    rifles.push(newRifle);
    setWebStore('rifles', rifles);
    return newRifle.id;
  }
  const result = await db.runAsync('INSERT INTO rifles (name, caliber, zero_distance_yd) VALUES (?, ?, ?);', [name, caliber, zeroDistanceYd]);
  return result.lastInsertRowId;
};

export const addChronoLog = async (rifleId, tempF, velocityFps, powderName = '') => {
  if (isWeb) {
    const logs = getWebStore('chronograph_logs');
    const newLog = { id: Date.now(), rifle_id: rifleId, temp_f: tempF, velocity_fps: velocityFps, powder_name: powderName, created_at: new Date().toISOString() };
    logs.push(newLog);
    setWebStore('chronograph_logs', logs);
    return newLog.id;
  }
  const result = await db.runAsync('INSERT INTO chronograph_logs (rifle_id, temp_f, velocity_fps, powder_name) VALUES (?, ?, ?, ?);', [rifleId, tempF, velocityFps, powderName]);
  return result.lastInsertRowId;
};

export const getChronoLogsByRifle = async (rifleId) => {
  if (isWeb) return getWebStore('chronograph_logs').filter((log) => log.rifle_id === rifleId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return await db.getAllAsync('SELECT * FROM chronograph_logs WHERE rifle_id = ? ORDER BY created_at DESC;', [rifleId]);
};

export const addShotGroup = async (rifleId, distanceYd, cep50, extremeSpread, shotCount) => {
  if (isWeb) {
    const groups = getWebStore('shot_groups');
    const newGroup = { id: Date.now(), rifle_id: rifleId, distance_yd: distanceYd, cep_50_inches: cep50, extreme_spread_inches: extremeSpread, shot_count: shotCount, created_at: new Date().toISOString() };
    groups.push(newGroup);
    setWebStore('shot_groups', groups);
    return newGroup.id;
  }
  const result = await db.runAsync('INSERT INTO shot_groups (rifle_id, distance_yd, cep_50_inches, extreme_spread_inches, shot_count) VALUES (?, ?, ?, ?, ?);', [rifleId, distanceYd, cep50, extremeSpread, shotCount]);
  return result.lastInsertRowId;
};

export const getShotGroupsByRifle = async (rifleId) => {
  if (isWeb) return getWebStore('shot_groups').filter((group) => group.rifle_id === rifleId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return await db.getAllAsync('SELECT * FROM shot_groups WHERE rifle_id = ? ORDER BY created_at DESC;', [rifleId]);
};