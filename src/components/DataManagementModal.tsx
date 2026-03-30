import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, font } from '../theme';

interface DataManagementModalProps {
  visible: boolean;
  onClose: () => void;
  onBackup: () => Promise<void>;
  onRestore: () => Promise<void>;
  backupSummary: string;
}

type Status = { type: 'success' | 'error'; message: string } | null;

export default function DataManagementModal({
  visible,
  onClose,
  onBackup,
  onRestore,
  backupSummary,
}: DataManagementModalProps) {
  const [loading, setLoading] = useState<'backup' | 'restore' | null>(null);
  const [status, setStatus] = useState<Status>(null);

  async function handleBackup() {
    setLoading('backup');
    setStatus(null);
    try {
      await onBackup();
      setStatus({ type: 'success', message: 'Backup ready — save it somewhere safe.' });
    } catch {
      setStatus({ type: 'error', message: 'Backup failed. Please try again.' });
    } finally {
      setLoading(null);
    }
  }

  async function handleRestore() {
    setLoading('restore');
    setStatus(null);
    try {
      await onRestore();
      setStatus({ type: 'success', message: 'Data restored successfully.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Restore failed. Please try again.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(null);
    }
  }

  function handleClose() {
    setStatus(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Data Management</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Backup</Text>
            <Text style={styles.sectionDesc}>
              Export all your tracks, bettors, bets, and templates to a JSON file you can
              save to Files, iCloud, or share via AirDrop.
            </Text>
            <Text style={styles.sectionSummary}>Current data: {backupSummary}</Text>
            <Pressable
              style={[styles.btn, styles.btnPrimary, loading === 'backup' && styles.btnDisabled]}
              onPress={handleBackup}
              disabled={loading !== null}
            >
              {loading === 'backup' ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={styles.btnText}>Export Backup</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Restore</Text>
            <Text style={styles.sectionDesc}>
              Import a previously exported backup file. This will replace all current
              data with the backup.
            </Text>
            <Pressable
              style={[styles.btn, styles.btnWarning, loading === 'restore' && styles.btnDisabled]}
              onPress={handleRestore}
              disabled={loading !== null}
            >
              {loading === 'restore' ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={styles.btnText}>Import Backup</Text>
              )}
            </Pressable>
          </View>

          {status && (
            <View style={[styles.statusBox, status.type === 'error' ? styles.statusError : styles.statusSuccess]}>
              <Text style={styles.statusText}>{status.message}</Text>
            </View>
          )}

          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: font.lg,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '600',
  },
  sectionDesc: {
    color: colors.textMuted,
    fontSize: font.sm,
    lineHeight: 18,
  },
  sectionSummary: {
    color: colors.textDim,
    fontSize: font.sm,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  btn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnWarning: {
    backgroundColor: colors.warningDim,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '600',
  },
  statusBox: {
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  statusSuccess: {
    backgroundColor: colors.successDim,
  },
  statusError: {
    backgroundColor: colors.dangerDim,
  },
  statusText: {
    color: colors.text,
    fontSize: font.sm,
  },
  closeBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: font.md,
    fontWeight: '600',
  },
});
