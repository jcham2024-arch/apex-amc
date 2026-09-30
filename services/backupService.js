import * as FileSystem from 'expo-file-system';
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

    const csvString = csvLines.join('\n');
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
    const lines = csvString.split(/\r?\n/).filter((line) => line.trim() !== '');

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
