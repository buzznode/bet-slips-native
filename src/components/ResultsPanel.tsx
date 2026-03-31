import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BetResult } from '../types';
import { colors, spacing, radius, font } from '../theme';

const MAX_DISPLAY = 100;

interface ResultsPanelProps {
  result: BetResult;
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
  const [combosOpen, setCombosOpen] = useState(false);
  const displayList = result.combinationList.slice(0, MAX_DISPLAY);
  const overflow = result.combinationList.length - displayList.length;
  const hasLegs = result.legs && result.legs.length > 0;
  const hasCombos = displayList.length > 0;

  if (!hasLegs && !hasCombos) return null;

  return (
    <View style={styles.panel}>
      {hasLegs && (
        <View style={styles.legs}>
          <Text style={styles.legsHeader}>Leg breakdown</Text>
          {result.legs!.map((leg, i) => (
            <View key={i} style={styles.legRow}>
              <Text style={styles.legLabel}>Race {i + 1}</Text>
              <Text style={styles.legHorses}>{leg.join(', ')}</Text>
              <Text style={styles.legCount}>
                {leg.length} horse{leg.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ))}
          <Text style={styles.legsFormula}>
            {result.legs!.map((l) => l.length).join(' × ')} ={' '}
            {result.combinations} ticket{result.combinations !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {hasCombos && (
        <View style={styles.combos}>
          <Pressable
            style={styles.combosToggle}
            onPress={() => setCombosOpen((o) => !o)}
          >
            <Text style={styles.combosToggleText}>
              All covered combinations ({result.combinations})
            </Text>
            <Text style={[styles.chevron, combosOpen && styles.chevronOpen]}>
              ›
            </Text>
          </Pressable>

          {combosOpen && (
            <View style={styles.combosGrid}>
              {displayList.map((combo, i) => (
                <View key={i} style={styles.combo}>
                  <Text style={styles.comboText}>{combo.join(' → ')}</Text>
                </View>
              ))}
              {overflow > 0 && (
                <View style={styles.combo}>
                  <Text style={styles.overflowText}>+{overflow} more</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  legs: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  legsHeader: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legLabel: {
    color: colors.textDim,
    fontSize: font.sm,
    width: 54,
  },
  legHorses: {
    color: colors.text,
    fontSize: font.sm,
    flex: 1,
  },
  legCount: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  legsFormula: {
    color: colors.primary,
    fontSize: font.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  combos: {
    marginBottom: spacing.sm,
  },
  combosToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  combosToggleText: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  chevron: {
    color: colors.textDim,
    fontSize: 20,
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  combosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  combo: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  comboText: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontFamily: 'monospace',
  },
  overflowText: {
    color: colors.textDim,
    fontSize: font.sm,
    fontStyle: 'italic',
  },
});
