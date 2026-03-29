import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';
import type { BettorState, RaceDaySession } from '../types';
import HorseButton from './HorseButton';
import SelectPicker from './SelectPicker';
import { colors, spacing, radius, font } from '../theme';

const HORSE_COUNTS = Array.from({ length: 19 }, (_, i) => i + 2); // 2–20
const BET_UNITS = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0];
const RACE_NUMBERS = Array.from({ length: 15 }, (_, i) => i + 1); // 1–15

interface RaceDaySetupProps {
  raceDay: RaceDaySession;
  betUnit: number;
  budget?: number;
  totalSpent?: number;
  bettors?: BettorState[];
  raceCosts?: Record<number, Record<string, number>>;
  onBetUnitChange: (value: number) => void;
  onBudgetChange: (value: number | undefined) => void;
  onChange: (raceDay: RaceDaySession) => void;
}

export default function RaceDaySetup({
  raceDay,
  betUnit,
  budget,
  totalSpent = 0,
  bettors = [],
  raceCosts = {},
  onBetUnitChange,
  onBudgetChange,
  onChange,
}: RaceDaySetupProps) {
  const [expanded, setExpanded] = useState(true);

  function update(changes: Partial<RaceDaySession>) {
    onChange({ ...raceDay, ...changes });
  }

  function updateCurrentRace(
    changes: Partial<{ numHorses: number; scratchedHorses: number[] }>,
  ) {
    const current = raceDay.races[raceDay.currentRace] ?? {
      numHorses: 8,
      scratchedHorses: [],
    };
    onChange({
      ...raceDay,
      races: {
        ...raceDay.races,
        [raceDay.currentRace]: { ...current, ...changes },
      },
    });
  }

  function handleToggleScratch(horse: number) {
    const current = raceDay.races[raceDay.currentRace] ?? {
      numHorses: 8,
      scratchedHorses: [],
    };
    const scratched = current.scratchedHorses;
    updateCurrentRace({
      scratchedHorses: scratched.includes(horse)
        ? scratched.filter((h) => h !== horse)
        : [...scratched, horse],
    });
  }

  const currentConfig = raceDay.races[raceDay.currentRace] ?? {
    numHorses: 8,
    scratchedHorses: [],
  };
  const horses = Array.from({ length: currentConfig.numHorses }, (_, i) => i + 1);

  const budgetPct =
    budget && budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const overBudget = budget !== undefined && totalSpent > budget;
  const nearBudget = !overBudget && budgetPct >= 75;

  const firstRaceOptions = RACE_NUMBERS.slice(0, -1).map((n) => ({
    label: `Race ${n}`,
    value: n,
  }));
  const lastRaceOptions = RACE_NUMBERS.slice(1).map((n) => ({
    label: `Race ${n}`,
    value: n,
  }));
  const betUnitOptions = BET_UNITS.map((u) => ({
    label: `$${u.toFixed(2)}`,
    value: u,
  }));
  const horseCountOptions = HORSE_COUNTS.map((n) => ({
    label: `${n} horses`,
    value: n,
  }));

  const raceCostRaces = Object.keys(raceCosts).map(Number).sort((a, b) => a - b);

  return (
    <View style={styles.section}>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.title}>Race Card</Text>
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
      </Pressable>

      {expanded && (
        <>
          {/* Race range + bet unit */}
          <View style={styles.rangeRow}>
            <SelectPicker
              label="First Race"
              value={raceDay.firstRace}
              options={firstRaceOptions}
              onChange={(first) => {
                const last = Math.max(first + 1, raceDay.lastRace);
                const current = Math.max(first, Math.min(raceDay.currentRace, last));
                update({ firstRace: first, lastRace: last, currentRace: current });
              }}
            />
            <Text style={styles.rangeSep}>–</Text>
            <SelectPicker
              label="Last Race"
              value={raceDay.lastRace}
              options={lastRaceOptions}
              onChange={(last) => {
                const first = Math.min(raceDay.firstRace, last - 1);
                const current = Math.max(first, Math.min(raceDay.currentRace, last));
                update({ firstRace: first, lastRace: last, currentRace: current });
              }}
            />
            <SelectPicker
              label="Bet Unit"
              value={betUnit}
              options={betUnitOptions}
              onChange={onBetUnitChange}
            />
          </View>

          {/* Race nav */}
          <View style={styles.raceNav}>
            <Pressable
              style={[
                styles.navBtn,
                raceDay.currentRace <= raceDay.firstRace && styles.navBtnDisabled,
              ]}
              onPress={() => update({ currentRace: raceDay.currentRace - 1 })}
              disabled={raceDay.currentRace <= raceDay.firstRace}
            >
              <Text style={styles.navBtnText}>‹</Text>
            </Pressable>
            <Text style={styles.raceLabel}>Race {raceDay.currentRace}</Text>
            <Pressable
              style={[
                styles.navBtn,
                raceDay.currentRace >= raceDay.lastRace && styles.navBtnDisabled,
              ]}
              onPress={() => update({ currentRace: raceDay.currentRace + 1 })}
              disabled={raceDay.currentRace >= raceDay.lastRace}
            >
              <Text style={styles.navBtnText}>›</Text>
            </Pressable>
          </View>

          {/* Horses in race */}
          <View style={styles.raceConfig}>
            <SelectPicker
              label="Horses in Race"
              value={currentConfig.numHorses}
              options={horseCountOptions}
              onChange={(n) => updateCurrentRace({ numHorses: n })}
            />
          </View>

          {/* Scratches */}
          <View style={styles.scratches}>
            <Text style={styles.fieldLabel}>
              Scratches
              {currentConfig.scratchedHorses.length > 0
                ? ` (${currentConfig.scratchedHorses.length})`
                : ''}
            </Text>
            <View style={styles.scratchGrid}>
              {horses.map((n) => (
                <HorseButton
                  key={n}
                  number={n}
                  size="small"
                  variant={
                    currentConfig.scratchedHorses.includes(n)
                      ? 'scratched'
                      : 'default'
                  }
                  allowScratchedPress
                  onClick={() => handleToggleScratch(n)}
                />
              ))}
            </View>
          </View>

          {/* Budget */}
          <View style={styles.budget}>
            <View style={styles.budgetRow}>
              <Text style={styles.fieldLabel}>Budget</Text>
              <View style={styles.budgetInputWrap}>
                <Text style={styles.budgetDollar}>$</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={budget !== undefined ? String(budget) : ''}
                  onChangeText={(v) => {
                    const n = parseFloat(v);
                    onBudgetChange(isNaN(n) || n <= 0 ? undefined : n);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>
            {budget !== undefined && budget > 0 && (
              <View style={styles.budgetStatus}>
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
                <Text
                  style={[
                    styles.budgetLabel,
                    overBudget && styles.budgetLabelOver,
                  ]}
                >
                  ${totalSpent.toFixed(2)} of ${budget.toFixed(2)}
                  {overBudget ? ' — over budget!' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Cost per race table */}
          {bettors.length > 0 && raceCostRaces.length > 0 && (
            <View style={styles.costs}>
              <Text style={styles.fieldLabel}>Cost per Race</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {/* Header */}
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableCellHeader]}>Race</Text>
                    {bettors.map((b) => (
                      <Text key={b.id} style={[styles.tableCell, styles.tableCellHeader]}>
                        {b.name}
                      </Text>
                    ))}
                  </View>
                  {/* Rows */}
                  {raceCostRaces.map((raceNum) => (
                    <View
                      key={raceNum}
                      style={[
                        styles.tableRow,
                        raceNum === raceDay.currentRace && styles.tableRowCurrent,
                      ]}
                    >
                      <Text style={styles.tableCell}>R{raceNum}</Text>
                      {bettors.map((b) => (
                        <Text key={b.id} style={styles.tableCell}>
                          {raceCosts[raceNum]?.[b.id]
                            ? `$${raceCosts[raceNum][b.id].toFixed(2)}`
                            : '—'}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
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
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  rangeSep: {
    color: colors.textDim,
    fontSize: font.xl,
    marginBottom: spacing.xs,
  },
  raceNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 26,
  },
  raceLabel: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'center',
  },
  raceConfig: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  scratches: {
    marginTop: spacing.md,
  },
  scratchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  budget: {
    marginTop: spacing.md,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  budgetDollar: {
    color: colors.textMuted,
    fontSize: font.md,
    marginRight: 2,
  },
  budgetInput: {
    color: colors.text,
    fontSize: font.md,
    paddingVertical: spacing.xs + 2,
    minWidth: 70,
  },
  budgetStatus: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  budgetTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  budgetFill: {
    height: 6,
    backgroundColor: colors.success,
    borderRadius: radius.full,
  },
  budgetFillNear: {
    backgroundColor: colors.warning,
  },
  budgetFillOver: {
    backgroundColor: colors.danger,
  },
  budgetLabel: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  budgetLabelOver: {
    color: colors.danger,
  },
  costs: {
    marginTop: spacing.md,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowCurrent: {
    backgroundColor: colors.primaryDim,
  },
  tableCell: {
    color: colors.textMuted,
    fontSize: font.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    minWidth: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCellHeader: {
    color: colors.textDim,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
});
