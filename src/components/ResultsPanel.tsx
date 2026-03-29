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

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>Results</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {result.betType}
            {result.modifier ? (
              <Text style={styles.modifier}> ({result.modifier.toLowerCase()})</Text>
            ) : null}
          </Text>
          <Text style={styles.statLabel}>Bet Type</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statValue}>{result.combinations}</Text>
          <Text style={styles.statLabel}>Combinations</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statValue}>${result.unitCost.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Per Ticket</Text>
        </View>

        <View style={[styles.stat, styles.statTotal]}>
          <Text style={[styles.statValue, styles.statValueAccent]}>
            ${result.totalCost.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total Cost</Text>
        </View>
      </View>

      {result.legs && (
        <View style={styles.legs}>
          <Text style={styles.legsHeader}>Leg breakdown</Text>
          {result.legs.map((leg, i) => (
            <View key={i} style={styles.legRow}>
              <Text style={styles.legLabel}>Race {i + 1}</Text>
              <Text style={styles.legHorses}>{leg.join(', ')}</Text>
              <Text style={styles.legCount}>
                {leg.length} horse{leg.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ))}
          <Text style={styles.legsFormula}>
            {result.legs.map((l) => l.length).join(' × ')} ={' '}
            {result.combinations} ticket{result.combinations !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {displayList.length > 0 && (
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
    padding: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statTotal: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statValue: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  modifier: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  statValueAccent: {
    color: colors.primaryLight,
    fontSize: font.md,
  },
  statLabel: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
  },
  legs: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
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
    marginTop: spacing.md,
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
