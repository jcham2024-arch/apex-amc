import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('ballistics_dope.db');
    // Enable Foreign Key support in SQLite
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDB();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS rifles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      caliber TEXT NOT NULL,
      barrel_twist TEXT,
      scope_name TEXT,
      scope_click_unit TEXT DEFAULT 'MOA',
      click_value REAL DEFAULT 0.25
    );

    CREATE TABLE IF NOT EXISTS ammo_loads (
      id TEXT PRIMARY KEY NOT NULL,
      rifle_id TEXT NOT NULL,
      bullet_brand TEXT NOT NULL,
      bullet_weight_grains REAL NOT NULL,
      powder_type TEXT,
      powder_grains REAL,
      muzzle_velocity_fps REAL,
      FOREIGN KEY (rifle_id) REFERENCES rifles (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS range_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      temperature_f REAL,
      density_altitude_ft REAL,
      wind_speed_mph REAL
    );

    CREATE TABLE IF NOT EXISTS targets (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      rifle_id TEXT NOT NULL,
      ammo_id TEXT NOT NULL,
      image_uri TEXT NOT NULL,
      distance_yards REAL NOT NULL,
      ppi REAL NOT NULL,
      extreme_spread_in REAL,
      mean_radius_in REAL,
      cep_50_in REAL,
      elevation_clicks_adj INTEGER,
      windage_clicks_adj INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES range_sessions (id) ON DELETE CASCADE,
      FOREIGN KEY (rifle_id) REFERENCES rifles (id),
      FOREIGN KEY (ammo_id) REFERENCES ammo_loads (id)
    );

    CREATE TABLE IF NOT EXISTS target_shots (
      id TEXT PRIMARY KEY NOT NULL,
      target_id TEXT NOT NULL,
      shot_index INTEGER NOT NULL,
      x_px REAL NOT NULL,
      y_px REAL NOT NULL,
      is_flyer INTEGER DEFAULT 0,
      FOREIGN KEY (target_id) REFERENCES targets (id) ON DELETE CASCADE
    );
  `);
};