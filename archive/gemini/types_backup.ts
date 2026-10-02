import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('dope_ballistics.db');

export const initDatabase = () => {
  db.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS rifles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      caliber TEXT NOT NULL,
      barrel_twist TEXT
    );

    CREATE TABLE IF NOT EXISTS loads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rifle_id INTEGER,
      name TEXT NOT NULL,
      bullet_weight_gr REAL,
      powder_charge_gr REAL,
      muzzle_velocity_fps REAL,
      FOREIGN KEY (rifle_id) REFERENCES rifles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS target_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      load_id INTEGER,
      image_uri TEXT NOT NULL,
      distance_yards REAL NOT NULL,
      temp_f REAL,
      density_altitude_ft REAL,
      ppi REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      x REAL NOT NULL,
      y REAL NOT NULL,
      is_flyer INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES target_sessions(id) ON DELETE CASCADE
    );
  `);
};
