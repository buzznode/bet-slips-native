import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HorseButton from './HorseButton';
import { colors, spacing, font } from '../theme';
import { calculatePositionalCombinations } from '../lib/betting';

const ORDINALS = ['1st', '2nd', '3rd', '4th'];

interface PositionalSelectorProps {
  numHorses: number;
  scratchedHorses: number[];
  positions: number; // 3 for trifecta, 4 for superfecta
  selectedLegs: number[][];
  disabled?: boolean;
  onToggle: (posIndex: number, horse: number) => void;
}

export default function PositionalSelector({
  numHorses,
  scratchedHorses,
  positions,
  selectedLegs,
  disabled = false,
  onToggle,
}: PositionalSelectorProps) {
  const horses = Array.from({ length: numHorses }, (_, i) => i + 1);

  // Horses that are the sole selection in any position — they're guaranteed
  // to occupy that slot on every ticket, so they can't appear elsewhere.
  const lockedHorses = new Set(
    selectedLegs
      .filter((leg) => leg.length === 1)
      .map((leg) => leg[0]),
  );

  const validCombos = selectedLegs.every((l) => l.length > 0)
    ? calculatePositionalCombinations(selectedLegs)
    : null;

  const allFilled = selectedLegs.every((l) => l.length > 0);

  // Effective count per position: exclude horses locked in other positions
  const effectiveCounts = selectedLegs.map((leg, posIndex) =>
    leg.filter(
      (h) => !selectedLegs.some((other, j) => j !== posIndex && other.length === 1 && other[0] === h),
    ).length,
  );

  function getHint() {
    if (!allFilled) return 'Select at least one horse per position';
    if (validCombos === 0) return '⚠️ No valid tickets — a horse appears in conflicting positions';
    return `${effectiveCounts.join(' × ')} selections → ${validCombos} valid ticket${validCombos !== 1 ? 's' : ''}`;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Select Horses by Position</Text>
      <View style={styles.positions}>
        {selectedLegs.slice(0, positions).map((legHorses, posIndex) => {
          const ordinal = ORDINALS[posIndex];
          return (
            <View key={posIndex} style={styles.positionGroup}>
              <View style={styles.posHeader}>
                <Text style={styles.posLabel}>{ordinal} Place</Text>
                {legHorses.length > 0 && (
                  <Text style={styles.posCount}>
                    {legHorses.length} horse{legHorses.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <View style={styles.grid}>
                {horses.map((n) => {
                  const isScratched = scratchedHorses.includes(n);
                  const isSelected = legHorses.includes(n);
                  // Locked if it's the sole pick in a *different* position
                  const isLockedElsewhere =
                    lockedHorses.has(n) &&
                    !(legHorses.length === 1 && legHorses[0] === n);
                  return (
                    <HorseButton
                      key={n}
                      number={n}
                      variant={
                        isScratched
                          ? 'scratched'
                          : isSelected
                            ? 'selected'
                            : 'default'
                      }
                      disabled={disabled || isLockedElsewhere}
                      onClick={() => !isScratched && onToggle(posIndex, n)}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={[styles.hint, validCombos === 0 && styles.hintWarning]}>
        {getHint()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  positions: {
    gap: spacing.lg,
  },
  positionGroup: {
    gap: spacing.sm,
  },
  posHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  posLabel: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  posCount: {
    color: colors.primary,
    fontSize: font.sm,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hint: {
    color: colors.textDim,
    fontSize: font.sm,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  hintWarning: {
    color: colors.warning,
    fontStyle: 'normal',
  },
});
