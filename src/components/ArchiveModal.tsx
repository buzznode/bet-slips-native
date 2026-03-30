import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseArchive, buildSummaries, ARCHIVE_KEY } from '../lib/archive';
import type { ArchiveEntry } from '../lib/archive';
import DaySummaryModal from './DaySummaryModal';

interface ArchiveModalProps {
  visible: boolean;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ArchiveModal({ visible, onClose }: ArchiveModalProps) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ entry: ArchiveEntry; trackIndex: number } | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      AsyncStorage.getItem(ARCHIVE_KEY).then((raw) => {
        setEntries(parseArchive(raw));
        setLoading(false);
      });
    }
  }, [visible]);

  const selectedSummaries = selected ? buildSummaries(selected.entry) : [];
  const selectedTrack = selectedSummaries[selected?.trackIndex ?? 0];

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Race Day Archive</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No archived race days yet.</Text>
              <Text style={styles.emptyHint}>When you reset, choose "Save & Reset" to archive the day first.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {entries.map((entry) => {
                const summaries = buildSummaries(entry);
                const totalBets = entry.tracks.reduce(
                  (n, t) => n + t.bettors.reduce((m, b) => m + b.history.length, 0), 0,
                );

                return (
                  <View key={entry.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardDate}>{formatDate(entry.date)}</Text>
                      <Text style={styles.cardMeta}>{totalBets} bet{totalBets !== 1 ? 's' : ''}</Text>
                    </View>
                    {summaries.map((s, i) => (
                      <Pressable
                        key={i}
                        style={styles.trackRow}
                        onPress={() => setSelected({ entry, trackIndex: i })}
                      >
                        <View style={styles.trackInfo}>
                          <Text style={styles.trackName}>{s.trackName}</Text>
                          <Text style={styles.trackRaces}>Races {s.firstRace}–{s.lastRace}</Text>
                        </View>
                        <Text style={styles.trackChevron}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {selected && selectedTrack && (
        <DaySummaryModal
          trackName={selectedTrack.trackName}
          firstRace={selectedTrack.firstRace}
          lastRace={selectedTrack.lastRace}
          summary={selectedTrack.summary}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: font.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    color: colors.textDim,
    fontSize: font.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceHigh,
  },
  cardDate: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '700',
  },
  cardMeta: {
    color: colors.textDim,
    fontSize: font.sm,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trackInfo: {
    gap: 2,
  },
  trackName: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  trackRaces: {
    color: colors.textDim,
    fontSize: font.sm,
  },
  trackChevron: {
    color: colors.textDim,
    fontSize: font.lg,
  },
});
