import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ModifierId } from '../types';
import HorseButton from './HorseButton';
import { colors, spacing, radius, font } from '../theme';
import { haptic } from '../lib/haptics';

const KEY_MODIFIERS: ModifierId[] = ['key-horse', 'wheel', 'part-wheel'];
const ORDINALS = ['1st', '2nd', '3rd', '4th'];

interface HorseSelectorProps {
  numHorses: number;
  selectedHorses: number[];
  scratchedHorses: number[];
  scratchConflicts?: number[];
  modifier: ModifierId | null;
  betId?: string | null;
  positions?: number;
  exactaKeyPosition?: 'top' | 'bottom';
  disabled?: boolean;
  onToggle: (horse: number) => void;
  onKeyPositionChange?: (pos: 'top' | 'bottom') => void;
}

export default function HorseSelector({
  numHorses,
  selectedHorses,
  scratchedHorses,
  scratchConflicts = [],
  modifier,
  betId,
  positions = 1,
  exactaKeyPosition = 'top',
  disabled = false,
  onToggle,
  onKeyPositionChange,
}: HorseSelectorProps) {
  const [expanded, setExpanded] = useState(true);
  const horses = Array.from({ length: numHorses }, (_, i) => i + 1);
  const isKeyMode = modifier !== null && KEY_MODIFIERS.includes(modifier);
  const keyHorse = isKeyMode ? selectedHorses[0] : null;
  const withHorses = isKeyMode ? selectedHorses.slice(1) : [];

  const isExactaKey = betId === 'exacta' && modifier === 'key-horse';
  const isExactaPositional =
    betId === 'exacta' && (modifier === 'wheel' || modifier === 'part-wheel');

  function getVariant(n: number) {
    if (scratchedHorses.includes(n)) return 'scratched' as const;
    if (!selectedHorses.includes(n)) return 'default' as const;
    if (isKeyMode) {
      return n === keyHorse ? ('key' as const) : ('with' as const);
    }
    return 'selected' as const;
  }

  function getHint() {
    if (modifier === 'key-horse') {
      if (selectedHorses.length === 0) return isExactaKey
        ? 'Select your key horse — all others will be auto-selected'
        : 'Select your key horse first, then the others';
      if (isExactaKey) return `Key: ${keyHorse} | With: ${withHorses.join(', ')} — creates 2 bets (top & bottom)`;
      if (selectedHorses.length === 1) return `Key horse: ${keyHorse} — now select horses to fill remaining positions`;
      return `Key: ${keyHorse} | With: ${withHorses.join(', ')}`;
    }
    if (modifier === 'wheel' || modifier === 'part-wheel') {
      if (selectedHorses.length === 0) return 'Select your key horse first, then the others';
      if (selectedHorses.length === 1) return `Key horse: ${keyHorse} — now select horses to fill remaining positions`;
      return `Key: ${keyHorse} | With: ${withHorses.join(', ')}`;
    }
    if (modifier === 'straight' || modifier === null) {
      if (positions > 1) {
        const next = ORDINALS[selectedHorses.length];
        if (next) return `Select your ${next} place horse`;
        return `${ORDINALS.slice(0, positions).map((o, i) => `${o}: ${selectedHorses[i]}`).join(', ')}`;
      }
    }
    return 'Select horses for your bet';
  }

  return (
    <View style={styles.section}>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.title}>Select Horses</Text>
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
      </Pressable>

      {expanded && (
        <>
          {isExactaPositional && !isExactaKey && onKeyPositionChange && (
            <View style={styles.positionToggle}>
              <Text style={styles.positionLabel}>Key horse position:</Text>
              <View style={styles.positionBtns}>
                <Pressable
                  style={[styles.posBtn, exactaKeyPosition === 'top' && styles.posBtnActive]}
                  onPress={() => { haptic.selection(); onKeyPositionChange('top'); }}
                >
                  <Text style={[styles.posBtnText, exactaKeyPosition === 'top' && styles.posBtnTextActive]}>
                    1st (top)
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.posBtn, exactaKeyPosition === 'bottom' && styles.posBtnActive]}
                  onPress={() => { haptic.selection(); onKeyPositionChange('bottom'); }}
                >
                  <Text style={[styles.posBtnText, exactaKeyPosition === 'bottom' && styles.posBtnTextActive]}>
                    2nd (bottom)
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

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
  positionToggle: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  positionLabel: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  positionBtns: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  posBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  posBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  posBtnText: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  posBtnTextActive: {
    color: '#fff',
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
