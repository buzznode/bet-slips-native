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
import type { BettorDaySummary, DaySummary } from '../lib/outcomes';

interface ArchiveModalProps {
  visible: boolean;
  onClose: () => void;
}

type DetailView = {
  entry: ArchiveEntry;
  trackName: string;
  firstRace: number;
  lastRace: number;
  summary: DaySummary;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function pct(num: number, den: number): string {
  if (den === 0) return '—';
  return `${Math.round((num / den) * 100)}%`;
}

function formatNet(net: number): string {
  return `${net >= 0 ? '+' : ''}$${Math.abs(net).toFixed(2)}`;
}

function StatCard({ data, isTotal = false }: {
  data: BettorDaySummary | (Omit<BettorDaySummary, 'id' | 'name'> & { name?: string });
  isTotal?: boolean;
}) {
  const { races, wins, losses, totalBets, totalBet, wonBets, totalWon, hasPayouts } = data;
  const net = totalWon - totalBet;
  const winRate = pct(wins, wins + losses);
  const wonRate = pct(wonBets, totalBets);
  const name = isTotal ? 'Track Total' : ('name' in data ? data.name : '');

  return (
    <View style={[styles.statCard, isTotal && styles.statCardTotal]}>
      <Text style={[styles.statName, isTotal && styles.statNameTotal]}>{name}</Text>
      <View style={styles.statRow}>
        <Text style={styles.statKey}>Races ({races}):</Text>
        <Text style={styles.statVal}>{wins}W · {losses}L · {winRate}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statKey}>Bets ({totalBets}):</Text>
        <Text style={styles.statVal}>${totalBet.toFixed(2)}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statKey}>Won ({wonBets}):</Text>
        <Text style={styles.statVal}>{hasPayouts ? `$${totalWon.toFixed(2)} · ${wonRate}` : '—'}</Text>
      </View>
      <View style={[styles.statRow, styles.statRowNet]}>
        <Text style={styles.statKey}>Net:</Text>
        <Text style={[styles.statNet, hasPayouts && net >= 0 && styles.netPos, hasPayouts && net < 0 && styles.netNeg]}>
          {hasPayouts ? formatNet(net) : '—'}
        </Text>
      </View>
    </View>
  );
}

export default function ArchiveModal({ visible, onClose }: ArchiveModalProps) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DetailView | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      AsyncStorage.getItem(ARCHIVE_KEY).then((raw) => {
        setEntries(parseArchive(raw));
        setLoading(false);
      });
    } else {
      setDetail(null);
    }
  }, [visible]);

  if (detail) {
    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetail(null)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSub}>{formatDate(detail.entry.date)}</Text>
              <Text style={styles.title}>{detail.trackName}</Text>
              <Text style={styles.headerSub}>Races {detail.firstRace}–{detail.lastRace}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setDetail(null)}>
              <Text style={styles.closeBtnText}>‹ Back</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {detail.summary.bettors.map((b) => (
              <StatCard key={b.id} data={b} />
            ))}
            <StatCard data={detail.summary.totals} isTotal />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
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
                      onPress={() => setDetail({ entry, trackName: s.trackName, firstRace: s.firstRace, lastRace: s.lastRace, summary: s.summary })}
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
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: '700',
  },
  headerSub: {
    color: colors.textDim,
    fontSize: font.sm,
    marginBottom: 2,
  },
  closeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
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
  // stat card styles (inline DaySummary)
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  statCardTotal: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  statName: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statNameTotal: {
    color: colors.primaryLight,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRowNet: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  statKey: {
    color: colors.textDim,
    fontSize: font.sm,
  },
  statVal: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  statNet: {
    color: colors.textMuted,
    fontSize: font.md,
    fontWeight: '700',
  },
  netPos: { color: colors.success },
  netNeg: { color: colors.danger },
});
