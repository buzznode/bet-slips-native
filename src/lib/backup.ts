import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const APP_KEY = 'bet-slips-native';

export interface BackupFile {
  appKey: string;
  version: string;
  exportedAt: string;
  state: unknown;
}

export function buildBackupPayload(state: unknown, version: string): BackupFile {
  return {
    appKey: APP_KEY,
    version,
    exportedAt: new Date().toISOString(),
    state,
  };
}

export function validateBackupPayload(parsed: unknown): parsed is BackupFile {
  if (!parsed || typeof parsed !== 'object') return false;
  const b = parsed as Record<string, unknown>;
  return (
    b.appKey === APP_KEY &&
    typeof b.version === 'string' &&
    typeof b.exportedAt === 'string' &&
    b.state !== null &&
    typeof b.state === 'object'
  );
}

export async function exportBackup(state: unknown, version: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available in the iOS Simulator. Test backup on a real device.');
  }

  const payload = buildBackupPayload(state, version);
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `bet-slips-backup-${date}.json`;
  const file = new File(Paths.cache, fileName);
  file.write(JSON.stringify(payload, null, 2));

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Bet Slips Backup',
    UTI: 'public.json',
  });
}

export async function importBackup(): Promise<BackupFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'public.json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) return null;

  const file = new File(result.assets[0].uri);
  const raw = await file.text();

  const parsed = JSON.parse(raw);
  if (!validateBackupPayload(parsed)) {
    throw new Error('Invalid backup file. Make sure you selected a Bet Slips backup.');
  }

  return parsed;
}
