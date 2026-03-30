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
import type { BettorState, TrackSession } from '../types';
import { checkBetOutcome } from '../lib/outcomes';
import { colors, spacing, radius, font } from '../theme';

interface TrackQuickViewProps {
  track: TrackSession;
  bettors: BettorState[];
  firstRace: number;
  lastRace: number;
  onClose: () => void;
}

export default function TrackQuickView({
  track,
  bettors,
  firstRace,
  lastRace,
  onClose,
}: TrackQuickViewProps) {
  const raceNumbers = Array.from(
    { length: lastRace - firstRace + 1 },
    (_, i) => firstRace + i,
  );

  const superfectaRaces = new Set<number>(
    bettors.flatMap((b) =>
      b.history
        .filter((e) => e.betType.toLowerCase() === 'superfecta')
        .map((e) => e.raceNumber ?? 0),
    ),
  );

  function isRaceComplete(raceNum: number): boolean {
    const res = track.results[raceNum];
    return !!(
      res?.first != null &&
      res?.second != null &&
      res?.third != null &&
      (!superfectaRaces.has(raceNum) || res?.fourth != null)
    );
  }

  function formatResult(raceNum: number): string {
    const res = track.results[raceNum];
    if (!isRaceComplete(raceNum) || !res) return '—';
    const parts = [res.first, res.second, res.third];
    if (superfectaRaces.has(raceNum) && res.fourth != null) parts.push(res.fourth);
    return parts.join(' · ');
  }

  function bettorOutcome(bettor: BettorState, raceNum: number): 'win' | 'loss' | 'pending' | 'none' {
    const bets = bettor.history.filter((e) => e.raceNumber === raceNum);
    if (bets.length === 0) return 'none';
    if (!isRaceComplete(raceNum)) return 'pending';
    const outcomes = bets.map((e) => checkBetOutcome(e, track.results));
    if (outcomes.some((o) => o === 'win')) return 'win';
    return 'loss';
  }

  const activeBettors = bettors.filter((b) =>
    raceNumbers.some((r) => b.history.some((e) => e.raceNumber === r)),
  );

  // Width = name chars × 8px + 28px for ✓/✗ + padding, minimum 60px
  function colWidth(name: string): number {
    return Math.max(60, name.length * 8 + 28);
  }

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
          <Text style={styles.name}>{track.name}</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ height: Math.min(raceNumbers.length, 8) * 38 + 44 }}
          scrollIndicatorInsets={{ right: 1 }}
        >
          {/* Header row */}
          <View style={styles.row}>
            <View style={styles.fixedLeft}>
              <Text style={styles.headerText}>Race</Text>
              <Text style={[styles.headerText, styles.resultHeader]}>Result</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bettorCols}
              scrollEnabled={activeBettors.length > 0}
            >
              {activeBettors.map((b) => (
                <Text key={b.id} style={[styles.headerText, styles.bettorHeader, { width: colWidth(b.name) }]}>
                  {b.name}
                </Text>
              ))}
            </ScrollView>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Race rows */}
          {raceNumbers.map((raceNum) => {
            const complete = isRaceComplete(raceNum);
            return (
              <View key={raceNum} style={styles.row}>
                <View style={styles.fixedLeft}>
                  <Text style={styles.raceNum}>R{raceNum}</Text>
                  <Text style={[styles.result, !complete && styles.resultPending]}>
                    {formatResult(raceNum)}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bettorCols}
                  scrollEnabled={activeBettors.length > 0}
                >
                  {activeBettors.map((b) => {
                    const outcome = bettorOutcome(b, raceNum);
                    return (
                      <View key={b.id} style={[styles.bettorCell, { width: colWidth(b.name) }]}>
                        {outcome === 'none' && (
                          <Text style={styles.outcomeNone}>—</Text>
                        )}
                        {outcome === 'pending' && (
                          <Text style={styles.outcomePending}>·</Text>
                        )}
                        {outcome === 'win' && (
                          <Text style={styles.outcomeWin}>{b.name} ✓</Text>
                        )}
                        {outcome === 'loss' && (
                          <Text style={styles.outcomeLoss}>{b.name} ✗</Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const FIXED_LEFT_WIDTH = 140;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 38,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  fixedLeft: {
    width: FIXED_LEFT_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  headerText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultHeader: {
    flex: 1,
  },
  raceNum: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '700',
    width: 28,
  },
  result: {
    color: colors.text,
    fontSize: font.sm,
    flex: 1,
  },
  resultPending: {
    color: colors.textDim,
  },
  bettorCols: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  bettorHeader: {
    paddingHorizontal: spacing.sm,
  },
  bettorCell: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  outcomeWin: {
    color: colors.success,
    fontSize: font.sm,
    fontWeight: '600',
  },
  outcomeLoss: {
    color: colors.danger,
    fontSize: font.sm,
    fontWeight: '600',
  },
  outcomePending: {
    color: colors.textDim,
    fontSize: font.md,
  },
  outcomeNone: {
    color: colors.textDim,
    fontSize: font.sm,
  },
});
