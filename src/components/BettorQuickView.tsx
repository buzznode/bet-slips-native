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
import type { BettorState, RaceResult } from '../types';
import { checkBetOutcome } from '../lib/outcomes';
import { colors, spacing, radius, font } from '../theme';

interface BettorQuickViewProps {
  bettor: BettorState;
  results: Record<number, RaceResult>;
  onClose: () => void;
}

export default function BettorQuickView({ bettor, results, onClose }: BettorQuickViewProps) {
  const raceNums = Array.from(
    new Set(bettor.history.map((e) => e.raceNumber ?? 0)),
  ).sort((a, b) => a - b);

  const totalSpent = bettor.history.reduce((s, e) => s + e.totalCost, 0);
  const totalWon = bettor.history.reduce(
    (s, e) => s + (e.payout !== undefined ? e.payout : 0),
    0,
  );
  const hasAnyPayout = bettor.history.some((e) => e.payout !== undefined);
  const net = totalWon - totalSpent;

  const budgetPct =
    bettor.budget && bettor.budget > 0
      ? Math.min((totalSpent / bettor.budget) * 100, 100)
      : 0;
  const overBudget = bettor.budget !== undefined && totalSpent > bettor.budget;
  const nearBudget = !overBudget && budgetPct >= 75;

  type RaceStatus = 'win' | 'loss' | 'pending';

  const races = raceNums.map((raceNum) => {
    const bets = bettor.history.filter((e) => (e.raceNumber ?? 0) === raceNum);
    const cost = bets.reduce((s, e) => s + e.totalCost, 0);
    const payout = bets.reduce(
      (s, e) => s + (e.payout !== undefined ? e.payout : 0),
      0,
    );
    const hasPayout = bets.some((e) => e.payout !== undefined);
    const hasSup = bets.some((e) => e.betType.toLowerCase() === 'superfecta');
    const res = results[raceNum];
    const complete =
      !!res &&
      res.first != null &&
      res.second != null &&
      res.third != null &&
      (!hasSup || res.fourth != null);

    let status: RaceStatus = 'pending';
    if (complete) {
      const outcomes = bets.map((e) => checkBetOutcome(e, results));
      status = outcomes.some((o) => o === 'win') ? 'win' : 'loss';
    }

    return { raceNum, bets: bets.length, cost, payout, hasPayout, complete, status };
  });

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.name}>{bettor.name}</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Net P&L hero */}
        <View style={styles.hero}>
          <Text
            style={[
              styles.net,
              hasAnyPayout && net >= 0 && styles.netPos,
              hasAnyPayout && net < 0 && styles.netNeg,
            ]}
          >
            {hasAnyPayout
              ? `${net >= 0 ? '+' : ''}$${Math.abs(net).toFixed(2)}`
              : '—'}
          </Text>
          <Text style={styles.netLabel}>Net</Text>
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalVal}>${totalSpent.toFixed(2)}</Text>
              <Text style={styles.totalLabel}>Spent</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalVal}>
                {hasAnyPayout ? `$${totalWon.toFixed(2)}` : '—'}
              </Text>
              <Text style={styles.totalLabel}>Won</Text>
            </View>
            {bettor.budget !== undefined && bettor.budget > 0 && (
              <>
                <View style={styles.totalDivider} />
                <View style={styles.totalItem}>
                  <Text
                    style={[styles.totalVal, overBudget && styles.overBudget]}
                  >
                    ${Math.max(bettor.budget - totalSpent, 0).toFixed(2)}
                  </Text>
                  <Text style={styles.totalLabel}>Remaining</Text>
                </View>
              </>
            )}
          </View>

          {bettor.budget !== undefined && bettor.budget > 0 && (
            <View style={styles.budgetTrack}>
              <View
                style={[
                  styles.budgetFill,
                  { width: `${budgetPct}%` as `${number}%` },
                  overBudget && styles.budgetFillOver,
                  nearBudget && styles.budgetFillNear,
                ]}
              />
            </View>
          )}
        </View>

        {/* Per-race table */}
        {races.length > 0 && (
          <ScrollView
            style={styles.tableScroll}
            contentContainerStyle={styles.table}
          >
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.cellRace, styles.headerText]}>Race</Text>
              <Text style={[styles.cell, styles.cellBets, styles.headerText]}>Bets</Text>
              <Text style={[styles.cell, styles.cellCost, styles.headerText]}>Cost</Text>
              <Text style={[styles.cell, styles.cellPayout, styles.headerText]}>Payout</Text>
              <Text style={[styles.cell, styles.cellStatus, styles.headerText]}></Text>
            </View>
            {races.map((r) => (
              <View key={r.raceNum} style={styles.tableRow}>
                <Text style={[styles.cell, styles.cellRace]}>R{r.raceNum}</Text>
                <Text style={[styles.cell, styles.cellBets]}>{r.bets}</Text>
                <Text style={[styles.cell, styles.cellCost]}>${r.cost.toFixed(2)}</Text>
                <Text style={[styles.cell, styles.cellPayout]}>
                  {!r.complete
                    ? 'Pending'
                    : r.hasPayout
                      ? `$${r.payout.toFixed(2)}`
                      : '—'}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.cellStatus,
                    r.status === 'win' && styles.statusWin,
                    r.status === 'loss' && styles.statusLoss,
                    r.status === 'pending' && styles.statusPending,
                  ]}
                >
                  {r.status === 'win' ? 'W' : r.status === 'loss' ? 'L' : '·'}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {races.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No bets placed yet.</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    color: colors.text,
    fontSize: font.lg,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  net: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textMuted,
  },
  netPos: {
    color: colors.success,
  },
  netNeg: {
    color: colors.danger,
  },
  netLabel: {
    color: colors.textDim,
    fontSize: font.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  totalItem: {
    alignItems: 'center',
    gap: 2,
  },
  totalVal: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '600',
  },
  totalLabel: {
    color: colors.textDim,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  overBudget: {
    color: colors.danger,
  },
  budgetTrack: {
    width: '100%',
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  budgetFill: {
    height: 5,
    backgroundColor: colors.success,
    borderRadius: radius.full,
  },
  budgetFillNear: {
    backgroundColor: colors.warning,
  },
  budgetFillOver: {
    backgroundColor: colors.danger,
  },
  tableScroll: {
    flex: 1,
  },
  table: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    color: colors.textDim,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  cell: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  cellRace: {
    width: 40,
    fontWeight: '600',
  },
  cellBets: {
    width: 36,
    textAlign: 'center',
  },
  cellCost: {
    flex: 1,
  },
  cellPayout: {
    flex: 1,
  },
  cellStatus: {
    width: 20,
    textAlign: 'right',
    fontWeight: '700',
  },
  statusWin: {
    color: colors.success,
  },
  statusLoss: {
    color: colors.danger,
  },
  statusPending: {
    color: colors.textDim,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textDim,
    fontSize: font.sm,
  },
});
