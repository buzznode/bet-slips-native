import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BET_TYPES } from '../types';
import type { BetCategory, BetType } from '../types';
import { colors, spacing, radius, font } from '../theme';

interface BetTypeSelectorProps {
  selectedBetType: string | null;
  numHorses: number;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

const CATEGORIES: { id: BetCategory; label: string }[] = [
  { id: 'straight', label: 'Straight Bets' },
  { id: 'exotic', label: 'Exotic Bets' },
  { id: 'multi-race', label: 'Multi-Race Bets' },
];

function BetTypeCard({
  bet,
  isActive,
  isDisabled,
  onPress,
}: {
  bet: BetType;
  isActive: boolean;
  isDisabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.card,
        isActive && styles.cardActive,
        isDisabled && styles.cardDisabled,
      ]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
    >
      <Text style={[styles.cardName, isActive && styles.cardNameActive]}>
        {bet.name}
      </Text>
      <Text style={[styles.cardDesc, isActive && styles.cardDescActive]}>
        {bet.description}
      </Text>
    </Pressable>
  );
}

export default function BetTypeSelector({
  selectedBetType,
  numHorses,
  disabled = false,
  onSelect,
}: BetTypeSelectorProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.section}>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.title}>Bet Type</Text>
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
      </Pressable>

      {expanded &&
        CATEGORIES.map(({ id, label }) => {
          const bets = BET_TYPES.filter((b) => b.category === id);
          return (
            <View key={id} style={styles.group}>
              <Text style={styles.groupLabel}>{label}</Text>
              <View style={styles.grid}>
                {bets.map((bet) => (
                  <BetTypeCard
                    key={bet.id}
                    bet={bet}
                    isActive={selectedBetType === bet.id}
                    isDisabled={disabled || numHorses < bet.minHorses}
                    onPress={() => onSelect(bet.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}
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
  group: {
    marginTop: spacing.md,
  },
  groupLabel: {
    color: colors.textDim,
    fontSize: font.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 100,
    flex: 1,
  },
  cardActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  cardDisabled: {
    opacity: 0.35,
  },
  cardName: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '700',
  },
  cardNameActive: {
    color: colors.primaryLight,
  },
  cardDesc: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  cardDescActive: {
    color: colors.textMuted,
  },
});
