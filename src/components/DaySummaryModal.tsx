import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DaySummary, BettorDaySummary } from '../lib/outcomes';
import { colors, spacing, radius, font } from '../theme';

interface DaySummaryModalProps {
  trackName: string;
  firstRace: number;
  lastRace: number;
  summary: DaySummary;
  onClose: () => void;
}

function pct(num: number, den: number): string {
  if (den === 0) return '—';
  return `${Math.round((num / den) * 100)}%`;
}

function formatNet(net: number): string {
  return `${net >= 0 ? '+' : ''}$${Math.abs(net).toFixed(2)}`;
}

function StatCard({
  data,
  isTotal = false,
}: {
  data: BettorDaySummary | (Omit<BettorDaySummary, 'id' | 'name'> & { name?: string });
  isTotal?: boolean;
}) {
  const { races, wins, losses, totalBets, totalBet, wonBets, totalWon, hasPayouts } = data;
  const net = totalWon - totalBet;
  const winRate = pct(wins, wins + losses);
  const wonRate = pct(wonBets, totalBets);
  const name = isTotal ? 'Track Total' : ('name' in data ? data.name : '');

  return (
    <View style={[styles.card, isTotal && styles.cardTotal]}>
      <Text style={[styles.cardName, isTotal && styles.cardNameTotal]}>
        {name}
      </Text>

      <View style={styles.row}>
        <Text style={styles.key}>Races ({races}):</Text>
        <Text style={styles.val}>
          {wins}W · {losses}L · {winRate}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.key}>Bets ({totalBets}):</Text>
        <Text style={styles.val}>${totalBet.toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.key}>Won ({wonBets}):</Text>
        <Text style={styles.val}>
          {hasPayouts ? `$${totalWon.toFixed(2)} · ${wonRate}` : '—'}
        </Text>
      </View>

      <View style={[styles.row, styles.rowNet]}>
        <Text style={styles.key}>Net:</Text>
        <Text
          style={[
            styles.net,
            hasPayouts && net >= 0 && styles.netPos,
            hasPayouts && net < 0 && styles.netNeg,
          ]}
        >
          {hasPayouts ? formatNet(net) : '—'}
        </Text>
      </View>
    </View>
  );
}

export default function DaySummaryModal({
  trackName,
  firstRace,
  lastRace,
  summary,
  onClose,
}: DaySummaryModalProps) {
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.trackName}>{trackName}</Text>
            <Text style={styles.title}>Day Summary</Text>
            <Text style={styles.races}>
              Races {firstRace}–{lastRace}
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {summary.bettors.map((b) => (
            <StatCard key={b.id} data={b} />
          ))}
          <StatCard data={summary.totals} isTotal />
        </ScrollView>
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
  trackName: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  title: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  races: {
    color: colors.textDim,
    fontSize: font.sm,
    marginTop: 2,
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
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardTotal: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  cardName: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  cardNameTotal: {
    color: colors.primaryLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowNet: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  key: {
    color: colors.textDim,
    fontSize: font.sm,
  },
  val: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  net: {
    color: colors.textMuted,
    fontSize: font.md,
    fontWeight: '700',
  },
  netPos: {
    color: colors.success,
  },
  netNeg: {
    color: colors.danger,
  },
});
