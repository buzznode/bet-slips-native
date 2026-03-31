import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { RaceResult } from '../types';
import { colors, spacing, radius, font } from '../theme';

const STANDARD_KEY = 0;

interface RaceOutcomeProps {
  isRaceDay: boolean;
  firstRace: number;
  lastRace: number;
  currentRace?: number;
  races: Record<number, { numHorses: number; scratchedHorses: number[] }>;
  numHorses: number;
  results: Record<number, RaceResult>;
  superfectaRaces: Set<number>;
  onChange: (results: Record<number, RaceResult>) => void;
}

function HorseScrollRow({ children }: { children: React.ReactNode }) {
  const containerWidth = useRef(0);
  const [showHint, setShowHint] = useState(false);
  return (
    <View style={styles.horseScrollWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horsesRow}
        onLayout={(e) => { containerWidth.current = e.nativeEvent.layout.width; }}
        onContentSizeChange={(contentW) => {
          setShowHint(contentW > containerWidth.current);
        }}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          const atEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 4;
          setShowHint(!atEnd && contentSize.width > layoutMeasurement.width);
        }}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
      {showHint && (
        <View style={styles.horseScrollHint} pointerEvents="none">
          <Text style={styles.horseScrollHintText}>›</Text>
        </View>
      )}
    </View>
  );
}

export default function RaceOutcome({
  isRaceDay,
  firstRace,
  lastRace,
  currentRace,
  races,
  numHorses,
  results,
  superfectaRaces,
  onChange,
}: RaceOutcomeProps) {
  const [selectedRace, setSelectedRace] = useState<number>(
    isRaceDay ? (currentRace ?? firstRace) : STANDARD_KEY,
  );
  const [syncedCurrentRace, setSyncedCurrentRace] = useState(currentRace);
  const [open, setOpen] = useState(false);

  if (isRaceDay && currentRace !== undefined && currentRace !== syncedCurrentRace) {
    setSyncedCurrentRace(currentRace);
    setSelectedRace(currentRace);
  }

  const raceKey = isRaceDay ? selectedRace : STANDARD_KEY;
  const currentResult: RaceResult = results[raceKey] ?? {
    first: null,
    second: null,
    third: null,
    fourth: null,
  };

  const showFourth = superfectaRaces.has(raceKey);
  const horseCount = isRaceDay
    ? (races[selectedRace]?.numHorses ?? numHorses)
    : numHorses;
  const scratchedHorses = isRaceDay
    ? (races[selectedRace]?.scratchedHorses ?? [])
    : [];
  const horses = Array.from({ length: horseCount }, (_, i) => i + 1);

  const raceNumbers = isRaceDay
    ? Array.from({ length: lastRace - firstRace + 1 }, (_, i) => firstRace + i)
    : [];

  function setPosition(pos: 'first' | 'second' | 'third' | 'fourth', value: number | null) {
    const updated: RaceResult = { ...currentResult, [pos]: value };
    onChange({ ...results, [raceKey]: updated });
  }

  function clearRace() {
    const next = { ...results };
    delete next[raceKey];
    onChange(next);
  }

  function hasResult(key: number): boolean {
    const r = results[key];
    return !!(r && r.first !== null);
  }

  const filledCount = isRaceDay
    ? raceNumbers.filter((r) => hasResult(r)).length
    : hasResult(STANDARD_KEY)
      ? 1
      : 0;

  const hasCurrent =
    currentResult.first !== null ||
    currentResult.second !== null ||
    currentResult.third !== null ||
    currentResult.fourth !== null;

  const positions = showFourth
    ? (['first', 'second', 'third', 'fourth'] as const)
    : (['first', 'second', 'third'] as const);

  return (
    <View style={styles.section}>
      <Pressable style={styles.header} onPress={() => setOpen((o) => !o)}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Race Results</Text>
          {filledCount > 0 && (
            <View style={styles.tallyBadge}>
              <Text style={styles.tallyText}>
                {filledCount}{isRaceDay ? `/${raceNumbers.length}` : ''}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </Pressable>

      {open && (
        <View style={styles.body}>
          {isRaceDay && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.raceTabs}
            >
              {raceNumbers.map((raceNum) => (
                <Pressable
                  key={raceNum}
                  style={[
                    styles.raceTab,
                    selectedRace === raceNum && styles.raceTabActive,
                    hasResult(raceNum) && styles.raceTabDone,
                  ]}
                  onPress={() => setSelectedRace(raceNum)}
                >
                  <Text
                    style={[
                      styles.raceTabText,
                      selectedRace === raceNum && styles.raceTabTextActive,
                      hasResult(raceNum) && styles.raceTabTextDone,
                    ]}
                  >
                    R{raceNum}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {isRaceDay && (
            <View style={styles.raceLabel}>
              <Text style={styles.raceLabelText}>
                Race {selectedRace}
                {hasResult(selectedRace) ? '  ✓ Entered' : ''}
              </Text>
            </View>
          )}

          {positions.map((pos, idx) => {
            const posLabel = ['1st', '2nd', '3rd', '4th'][idx];
            const currentVal = currentResult[pos];
            const taken = positions
              .filter((p) => p !== pos)
              .map((p) => currentResult[p])
              .filter((v): v is number => v !== null);

            return (
              <View key={pos} style={styles.posRow}>
                <Text style={styles.posLabel}>{posLabel}</Text>
                <HorseScrollRow>
                  {horses.map((h) => {
                    const isSelected = currentVal === h;
                    const isTaken = taken.includes(h);
                    const isScratched = scratchedHorses.includes(h);
                    return (
                      <Pressable
                        key={h}
                        style={[
                          styles.horseBtn,
                          isSelected && styles.horseBtnSelected,
                          isTaken && styles.horseBtnTaken,
                          isScratched && styles.horseBtnScratched,
                        ]}
                        onPress={() => !isTaken && !isScratched && setPosition(pos, isSelected ? null : h)}
                        disabled={isTaken || isScratched}
                      >
                        <Text
                          style={[
                            styles.horseBtnText,
                            isSelected && styles.horseBtnTextSelected,
                            isTaken && styles.horseBtnTextTaken,
                            isScratched && styles.horseBtnScratched,
                          ]}
                        >
                          {h}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HorseScrollRow>
              </View>
            );
          })}

          {hasCurrent && (
            <Pressable style={styles.clearBtn} onPress={clearRace}>
              <Text style={styles.clearBtnText}>
                Clear{isRaceDay ? ` Race ${selectedRace}` : ''}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const HORSE_SIZE = 36;

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '700',
  },
  tallyBadge: {
    backgroundColor: colors.primaryDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tallyText: {
    color: colors.primaryLight,
    fontSize: 11,
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  raceTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  raceTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  raceTabActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  raceTabDone: {
    borderColor: colors.success,
  },
  raceTabText: {
    color: colors.textDim,
    fontSize: font.sm,
    fontWeight: '600',
  },
  raceTabTextActive: {
    color: colors.primaryLight,
  },
  raceTabTextDone: {
    color: colors.success,
  },
  raceLabel: {
    marginBottom: spacing.md,
  },
  raceLabelText: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  posRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  posLabel: {
    color: colors.textDim,
    fontSize: font.sm,
    fontWeight: '700',
    width: 28,
  },
  horseScrollWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  horsesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  horseScrollHint: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  horseScrollHintText: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '300',
  },
  horseBtn: {
    width: HORSE_SIZE,
    height: HORSE_SIZE,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horseBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  horseBtnTaken: {
    opacity: 0.25,
  },
  horseBtnScratched: {
    backgroundColor: colors.scratch,
    borderColor: colors.scratch,
    opacity: 0.5,
  },
  horseBtnText: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '600',
  },
  horseBtnTextSelected: {
    color: '#fff',
  },
  horseBtnTextTaken: {
    color: colors.textDim,
  },
  clearBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtnText: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
});
