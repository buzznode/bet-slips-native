import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HorseButton from './HorseButton';
import { colors, spacing, font } from '../theme';

interface LegConfig {
  numHorses: number;
  scratchedHorses: number[];
}

interface LegSelectorProps {
  numHorses: number;
  legs: number[][];
  onToggle: (legIndex: number, horse: number) => void;
  legConfigs?: LegConfig[];
  startRace?: number;
  disabled?: boolean;
}

export default function LegSelector({
  numHorses,
  legs,
  onToggle,
  legConfigs,
  startRace,
  disabled = false,
}: LegSelectorProps) {
  const allFilled = legs.length > 0 && legs.every((l) => l.length > 0);
  const totalCombos = legs.reduce((acc, l) => acc * (l.length || 1), 1);

  const hint = allFilled
    ? `${legs.map((l) => l.length).join(' × ')} = ${totalCombos} combination${totalCombos !== 1 ? 's' : ''}`
    : 'Select at least one horse per race';

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Select Horses</Text>
      <View style={styles.legs}>
        {legs.map((legHorses, legIndex) => {
          const legConfig = legConfigs?.[legIndex];
          const legNumHorses = legConfig?.numHorses ?? numHorses;
          const legScratched = legConfig?.scratchedHorses ?? [];
          const horses = Array.from({ length: legNumHorses }, (_, i) => i + 1);
          const raceNumber = (startRace ?? 1) + legIndex;

          return (
            <View key={legIndex} style={styles.leg}>
              <View style={styles.legHeader}>
                <Text style={styles.legTitle}>Race {raceNumber}</Text>
                {legHorses.length > 0 && (
                  <Text style={styles.legCount}>
                    {legHorses.length} horse{legHorses.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <View style={styles.grid}>
                {horses.map((n) => {
                  const isScratched = legScratched.includes(n);
                  return (
                    <HorseButton
                      key={n}
                      number={n}
                      variant={
                        isScratched
                          ? 'scratched'
                          : legHorses.includes(n)
                            ? 'selected'
                            : 'default'
                      }
                      disabled={disabled}
                      onClick={
                        isScratched ? () => {} : () => onToggle(legIndex, n)
                      }
                    />
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.hint}>{hint}</Text>
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
  legs: {
    gap: spacing.lg,
  },
  leg: {
    gap: spacing.sm,
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legTitle: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legCount: {
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
});
