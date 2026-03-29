import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ModifierId } from '../types';
import HorseButton from './HorseButton';
import { colors, spacing, radius, font } from '../theme';

const KEY_MODIFIERS: ModifierId[] = ['key-horse', 'wheel'];

interface HorseSelectorProps {
  numHorses: number;
  selectedHorses: number[];
  scratchedHorses: number[];
  scratchConflicts?: number[];
  modifier: ModifierId | null;
  disabled?: boolean;
  onToggle: (horse: number) => void;
}

export default function HorseSelector({
  numHorses,
  selectedHorses,
  scratchedHorses,
  scratchConflicts = [],
  modifier,
  disabled = false,
  onToggle,
}: HorseSelectorProps) {
  const [expanded, setExpanded] = useState(true);
  const horses = Array.from({ length: numHorses }, (_, i) => i + 1);
  const isKeyMode = modifier !== null && KEY_MODIFIERS.includes(modifier);
  const keyHorse = isKeyMode ? selectedHorses[0] : null;
  const withHorses = isKeyMode ? selectedHorses.slice(1) : [];

  function getVariant(n: number) {
    if (scratchedHorses.includes(n)) return 'scratched' as const;
    if (!selectedHorses.includes(n)) return 'default' as const;
    if (isKeyMode) {
      return n === keyHorse ? ('key' as const) : ('with' as const);
    }
    return 'selected' as const;
  }

  function getHint() {
    if (!isKeyMode) return 'Select horses for your bet';
    if (selectedHorses.length === 0)
      return 'Select your key horse first, then the others';
    if (selectedHorses.length === 1)
      return `Key horse: ${keyHorse} — now select horses to fill remaining positions`;
    return `Key: ${keyHorse} | With: ${withHorses.join(', ')}`;
  }

  return (
    <View style={styles.section}>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.title}>Select Horses</Text>
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
      </Pressable>

      {expanded && (
        <>
          <View style={styles.grid}>
            {horses.map((n) => (
              <HorseButton
                key={n}
                number={n}
                variant={getVariant(n)}
                disabled={disabled}
                onClick={() => !scratchedHorses.includes(n) && onToggle(n)}
              />
            ))}
          </View>
          {scratchConflicts.length > 0 && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠️ Horse{scratchConflicts.length > 1 ? 's' : ''}{' '}
                {scratchConflicts.join(', ')} is scratched — remove{' '}
                {scratchConflicts.length > 1 ? 'them' : 'it'} from your
                selection before calculating.
              </Text>
            </View>
          )}
          <Text style={styles.hint}>{getHint()}</Text>
        </>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '700',
  },
  chevron: {
    color: colors.textDim,
    fontSize: 20,
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  warning: {
    backgroundColor: colors.warningDim,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  warningText: {
    color: colors.warning,
    fontSize: font.sm,
  },
  hint: {
    color: colors.textDim,
    fontSize: font.sm,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
