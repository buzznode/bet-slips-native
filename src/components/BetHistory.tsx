import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { BetResult, RaceResult } from '../types';
import { checkBetOutcome } from '../lib/outcomes';
import { colors, spacing, radius, font } from '../theme';
import { haptic } from '../lib/haptics';

interface BettorPill {
  id: string;
  name: string;
  hasUnpaidWin?: boolean;
}

interface BetHistoryProps {
  history: { entry: BetResult; originalIndex: number }[];
  raceNumber: number;
  results: Record<number, RaceResult>;
  bettors?: BettorPill[];
  activeBettorId?: string;
  locked?: boolean;
  onSelectBettor?: (id: string) => void;
  onSlip?: () => void;
  onRemove: (originalIndex: number) => void;
  onClearAll: () => void;
  onSetPayout: (originalIndex: number, payout: number | undefined) => void;
}

const KEY_MODIFIERS_DISPLAY = ['Key Horse', 'Wheel', 'Part Wheel'];

function formatHorsesText(result: BetResult): string {
  if (result.legs && result.legs.length > 0) {
    return result.legs.map((leg, i) => `R${i + 1}: ${leg.join(',')}`).join(' / ');
  }
  if (KEY_MODIFIERS_DISPLAY.includes(result.modifier) && result.horses.length > 0) {
    const [key, ...rest] = result.horses;
    return rest.length > 0 ? `${key} / ${rest.join(', ')}` : String(key);
  }
  return result.horses.join(', ');
}

function formatLabel(result: BetResult): string {
  if (result.modifier) return `${result.betType} — ${result.modifier}`;
  return result.betType;
}

function BetEntry({
  entry,
  originalIndex,
  results,
  locked,
  onRemove,
  onSetPayout,
}: {
  entry: BetResult;
  originalIndex: number;
  results: Record<number, RaceResult>;
  locked: boolean;
  onRemove: () => void;
  onSetPayout: (payout: number | undefined) => void;
}) {
  const outcome = checkBetOutcome(entry, results);
  const [rawPayout, setRawPayout] = useState<string>(
    entry.payout !== undefined ? String(entry.payout) : '',
  );

  return (
    <View style={styles.entry}>
      <View style={styles.entryMain}>
        <Text style={styles.entryLabel}>{formatLabel(entry)}</Text>
        <View style={styles.entryRight}>
          {outcome === 'win' && (
            <Text style={styles.outcomeWin}>✓</Text>
          )}
          {outcome === 'loss' && (
            <Text style={styles.outcomeLoss}>✗</Text>
          )}
        </View>
      </View>

      {outcome === 'win' && (
        <View style={styles.payoutRow}>
          <Text style={styles.payoutLabel}>Payout</Text>
          <View style={styles.payoutInputWrap}>
            <Text style={styles.payoutPrefix}>$</Text>
            <TextInput
              style={styles.payoutInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textDim}
              value={rawPayout}
              onChangeText={setRawPayout}
              onBlur={() => {
                const val = parseFloat(rawPayout);
                if (isNaN(val) || rawPayout === '') {
                  onSetPayout(undefined);
                  setRawPayout('');
                } else {
                  onSetPayout(val);
                  setRawPayout(String(val));
                }
              }}
            />
          </View>
        </View>
      )}

      <View style={styles.entrySub}>
        <Text style={styles.entryHorses}>{formatHorsesText(entry)}</Text>
        <Text style={styles.entryCost}>${entry.totalCost.toFixed(2)}</Text>
        {!locked && (
          <Pressable onPress={() => { haptic.medium(); onRemove(); }} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>🗑</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function BetHistory({
  history,
  raceNumber,
  results,
  bettors = [],
  activeBettorId,
  locked = false,
  onSelectBettor,
  onSlip,
  onRemove,
  onClearAll,
  onSetPayout,
}: BetHistoryProps) {
  const [open, setOpen] = useState(true);

  if (history.length === 0) return null;

  const raceTotal = history.reduce((s, { entry }) => s + entry.totalCost, 0);
  const reversed = [...history].reverse();

  return (
    <View style={styles.section}>
      <Pressable
        style={styles.header}
        onPress={() => setOpen((o) => !o)}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Race {raceNumber} Bets</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{history.length}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {onSlip && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onSlip();
              }}
              style={styles.slipBtn}
            >
              <Text style={styles.slipBtnText}>📋 Slip</Text>
            </Pressable>
          )}
          <Text style={styles.total}>${raceTotal.toFixed(2)}</Text>
          <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
        </View>
      </Pressable>

      {open && (
        <View style={styles.body}>
          {bettors.length > 0 && onSelectBettor && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bettorPills}
            >
              {bettors.map((b) => (
                <Pressable
                  key={b.id}
                  style={[
                    styles.pill,
                    b.id === activeBettorId && styles.pillActive,
                  ]}
                  onPress={() => onSelectBettor(b.id)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      b.id === activeBettorId && styles.pillTextActive,
                    ]}
                  >
                    {b.name}{b.hasUnpaidWin ? ' 💰' : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {!locked && (
            <View style={styles.actions}>
              <Pressable onPress={() => { haptic.heavy(); onClearAll(); }}>
                <Text style={styles.clearAll}>Clear All</Text>
              </Pressable>
            </View>
          )}

          {reversed.map(({ entry, originalIndex }) => (
            <BetEntry
              key={originalIndex}
              entry={entry}
              originalIndex={originalIndex}
              results={results}
              locked={locked}
              onRemove={() => onRemove(originalIndex)}
              onSetPayout={(payout) => onSetPayout(originalIndex, payout)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  slipBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slipBtnText: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  total: {
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
  body: {
    paddingBottom: spacing.sm,
  },
  bettorPills: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  pillTextActive: {
    color: colors.primaryLight,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  clearAll: {
    color: colors.danger,
    fontSize: font.sm,
    fontWeight: '600',
  },
  entry: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  entryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryLabel: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '600',
    flex: 1,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  outcomeWin: {
    color: colors.success,
    fontSize: font.md,
    fontWeight: '700',
  },
  outcomeLoss: {
    color: colors.danger,
    fontSize: font.md,
    fontWeight: '700',
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  payoutLabel: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  payoutInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successDim,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  payoutPrefix: {
    color: colors.success,
    fontSize: font.sm,
  },
  payoutInput: {
    color: colors.text,
    fontSize: font.sm,
    paddingVertical: spacing.xs,
    minWidth: 60,
  },
  entrySub: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  entryHorses: {
    color: colors.textMuted,
    fontSize: font.sm,
    flex: 1,
  },
  entryCost: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  removeBtn: {
    padding: spacing.xs,
  },
  removeBtnText: {
    fontSize: 16,
  },
});
