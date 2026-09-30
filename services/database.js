import * as SQLite from 'expo-sqlite';

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
