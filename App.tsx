import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BET_TYPES,
  MODIFIERS,
  createBettor,
  createRaceDaySession,
  createTrack,
  uuid,
} from './src/types';
import type {
  ModifierId,
  BettorState,
  BetTemplate,
  RaceDaySession,
  TrackSession,
  RaceResult,
} from './src/types';
import {
  calculateCombinations,
  generateCombinationList,
  calculateLegCombinations,
  generateLegCombinationList,
  getMinHorses,
} from './src/lib/betting';
import { summarizeDay, checkBetOutcome } from './src/lib/outcomes';
import { haptic } from './src/lib/haptics';
import { exportBackup, importBackup } from './src/lib/backup';
import { addToArchive, parseArchive, ARCHIVE_KEY } from './src/lib/archive';

import Header from './src/components/Header';
import DataManagementModal from './src/components/DataManagementModal';
import ArchiveModal from './src/components/ArchiveModal';
import OnboardingModal from './src/components/OnboardingModal';
import TrackSelector from './src/components/TrackSelector';
import BettorSelector from './src/components/BettorSelector';
import RaceDaySetup from './src/components/RaceDaySetup';
import BetTemplates from './src/components/BetTemplates';
import BetTypeSelector from './src/components/BetTypeSelector';
import ModifierSelector from './src/components/ModifierSelector';
import HorseSelector from './src/components/HorseSelector';
import LegSelector from './src/components/LegSelector';
import CalculateButton from './src/components/CalculateButton';
import BetHistory from './src/components/BetHistory';
import RaceOutcome from './src/components/RaceOutcome';
import BetSummaryModal from './src/components/BetSummaryModal';
import DaySummaryModal from './src/components/DaySummaryModal';
import BettorQuickView from './src/components/BettorQuickView';
import TrackQuickView from './src/components/TrackQuickView';
import ErrorToast from './src/components/ErrorToast';
import { colors, spacing, radius, font } from './src/theme';

const STORAGE_KEY = 'bet-slips-native:v1';

interface AppState {
  tracks: TrackSession[];
  activeTrackId: string;
  templates: BetTemplate[];
}

function migrateState(raw: { tracks: TrackSession[]; activeTrackId: string }): {
  tracks: TrackSession[];
  activeTrackId: string;
} {
  return {
    ...raw,
    tracks: raw.tracks.map((t: TrackSession) => ({
      ...t,
      scratchedHorses: t.scratchedHorses ?? [],
      bettors:
        t.bettors?.map((bRaw: BettorState) => {
          const { scratchedHorses: _sc, ...b } = bRaw as BettorState & { scratchedHorses?: number[] };
          const { active: _active, ...savedRaceDay } = (b.raceDay ?? {}) as RaceDaySession & { active?: unknown };
          const raceDay = { ...createRaceDaySession(), ...savedRaceDay };
          const selectedModifier =
            b.selectedModifier === 'straight' ? null : (b.selectedModifier ?? null);
          return { ...b, raceDay, selectedModifier };
        }) ?? [],
      results: Object.fromEntries(
        Object.entries(t.results ?? {}).map(([k, v]) => [
          k,
          { ...(v as RaceResult), fourth: (v as RaceResult).fourth ?? null },
        ]),
      ),
    })),
  };
}

function buildDefaultState(): AppState {
  const firstTrack = createTrack('My Track');
  return { tracks: [firstTrack], activeTrackId: firstTrack.id, templates: [] };
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const betTypeSelectorY = useRef(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [daySummaryOpen, setDaySummaryOpen] = useState(false);
  const [quickViewBettorId, setQuickViewBettorId] = useState<string | null>(null);
  const [quickViewTrackId, setQuickViewTrackId] = useState<string | null>(null);
  const [horseError, setHorseError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem('bet-slips-native:onboarded'),
    ]).then(([raw, onboarded]) => {
      if (!onboarded) setOnboardingOpen(true);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.tracks?.length > 0) {
            const migrated = migrateState(parsed);
            setState({ ...migrated, templates: parsed.templates ?? [] });
            return;
          }
        } catch {
          // fall through to default
        }
      }
      setState(buildDefaultState());
    });
  }, []);

  // Persist on every state change
  useEffect(() => {
    if (!state) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  if (!state) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const { tracks, activeTrackId, templates } = state;
  const activeTrack = tracks.find((t) => t.id === activeTrackId)!;
  const bettors = activeTrack.bettors;
  const activeBettorId = activeTrack.activeBettorId;
  const active = bettors.find((b) => b.id === activeBettorId)!;


  const bettorTotal = active.history.reduce((s, e) => s + e.totalCost, 0);

  const showOutcomePanel =
    bettors.some((b) => b.history.length > 0) ||
    Object.keys(activeTrack.results ?? {}).length > 0;

  const superfectaRaces = new Set<number>(
    bettors.flatMap((b) =>
      b.history
        .filter((e) => e.betType.toLowerCase() === 'superfecta')
        .map((e) => e.raceNumber ?? 0),
    ),
  );

  const lastRaceComplete = (() => {
    const { lastRace } = active.raceDay;
    const res = activeTrack.results[lastRace];
    return (
      res?.first != null &&
      res?.second != null &&
      res?.third != null &&
      (!superfectaRaces.has(lastRace) || res?.fourth != null)
    );
  })();

  const isMultiRace =
    BET_TYPES.find((b) => b.id === active.selectedBetType)?.category ===
    'multi-race';

  const rdCurrentRace = active.raceDay.currentRace;
  const currentRaceConfig = active.raceDay.races[rdCurrentRace] ?? {
    numHorses: active.numHorses,
    scratchedHorses: [],
  };
  const effectiveNumHorses = currentRaceConfig.numHorses;
  const effectiveScratchedHorses = currentRaceConfig.scratchedHorses;

  const currentRaceResult = activeTrack.results[rdCurrentRace];
  const isRaceLocked = !!(
    currentRaceResult?.first != null &&
    currentRaceResult?.second != null &&
    currentRaceResult?.third != null &&
    (!superfectaRaces.has(rdCurrentRace) || currentRaceResult?.fourth != null)
  );

  const scratchConflicts = Object.fromEntries(
    bettors.map((b) => {
      const scratched = b.raceDay.races[rdCurrentRace]?.scratchedHorses ?? [];
      return [b.id, b.selectedHorses.filter((h) => scratched.includes(h))];
    }),
  );

  const unpaidWins = Object.fromEntries(
    bettors.map((b) => [
      b.id,
      b.history.some(
        (e) => checkBetOutcome(e, activeTrack.results) === 'win' && e.payout === undefined,
      ),
    ]),
  );


  const legConfigs = isMultiRace
    ? active.selectedLegs.map((_, i) => {
        const raceNum = rdCurrentRace + i;
        return (
          active.raceDay.races[raceNum] ?? {
            numHorses: active.numHorses,
            scratchedHorses: [],
          }
        );
      })
    : undefined;

  // ── State helpers ──────────────────────────────────────────────────────────

  function patchState(changes: Partial<AppState>) {
    setState((prev) => prev ? { ...prev, ...changes } : prev);
  }

  function updateTrack(id: string, changes: Partial<TrackSession>) {
    patchState({
      tracks: tracks.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    });
  }

  function updateBettors(newBettors: BettorState[]) {
    updateTrack(activeTrackId, { bettors: newBettors });
  }

  function updateActive(changes: Partial<BettorState>) {
    updateBettors(
      bettors.map((b) => (b.id === activeBettorId ? { ...b, ...changes } : b)),
    );
  }

  // ── Track handlers ─────────────────────────────────────────────────────────

  function handleAddTrack(name: string) {
    const newTrack = createTrack(name);
    patchState({
      tracks: [...tracks, newTrack],
      activeTrackId: newTrack.id,
    });
  }

  function handleRenameTrack(id: string, name: string) {
    updateTrack(id, { name });
  }

  function handleRemoveTrack(id: string) {
    const remaining = tracks.filter((t) => t.id !== id);
    patchState({
      tracks: remaining,
      ...(id === activeTrackId && remaining.length > 0
        ? { activeTrackId: remaining[remaining.length - 1].id }
        : {}),
    });
  }

  function handleResultsChange(updatedResults: Record<number, RaceResult>) {
    const lockingRace = Object.entries(updatedResults).find(([key, result]) => {
      const raceNum = Number(key);
      return result.first !== null && !activeTrack.results[raceNum]?.first;
    })?.[0];

    if (lockingRace !== undefined) {
      const raceNum = Number(lockingRace);
      const updatedBettors = bettors.map((b) => {
        if (b.raceDay.currentRace !== raceNum) return b;
        return {
          ...b,
          selectedBetType: null,
          selectedModifier: null,
          selectedHorses: [],
          selectedLegs: [],
          result: null,
        };
      });
      updateTrack(activeTrackId, {
        results: updatedResults,
        bettors: updatedBettors,
      });
    } else {
      updateTrack(activeTrackId, { results: updatedResults });
    }
  }

  function handleAdvanceRace() {
    if (rdCurrentRace >= active.raceDay.lastRace) return;
    updateBettors(
      bettors.map((b) =>
        b.raceDay.currentRace === rdCurrentRace
          ? { ...b, raceDay: { ...b.raceDay, currentRace: rdCurrentRace + 1 } }
          : b,
      ),
    );
  }

  // ── Template handlers ──────────────────────────────────────────────────────

  function handleSaveTemplate() {
    if (!active.selectedBetType) return;
    const bet = BET_TYPES.find((b) => b.id === active.selectedBetType)!;
    const effectiveModifier = active.selectedModifier ?? 'straight';
    const modifierName =
      MODIFIERS.find((m) => m.id === effectiveModifier)?.name ?? '';
    const isMultiRaceBet = bet.category === 'multi-race';
    const unit =
      active.betUnit % 1 === 0
        ? `$${active.betUnit}`
        : `$${active.betUnit.toFixed(2)}`;
    const name = `${unit} ${bet.name}${!isMultiRaceBet && effectiveModifier !== 'straight' ? ' ' + modifierName : ''}`;
    patchState({
      templates: [
        ...templates,
        {
          id: uuid(),
          name,
          betTypeId: active.selectedBetType!,
          modifier: effectiveModifier,
          betUnit: active.betUnit,
        },
      ],
    });
  }

  function handleDeleteTemplate(id: string) {
    patchState({ templates: templates.filter((t) => t.id !== id) });
  }

  function handleApplyTemplate(template: BetTemplate) {
    const bet = BET_TYPES.find((b) => b.id === template.betTypeId);
    if (!bet) return;
    haptic.medium();
    updateActive({
      selectedBetType: template.betTypeId,
      selectedModifier: template.modifier,
      betUnit: template.betUnit,
      selectedHorses: [],
      selectedLegs:
        bet.category === 'multi-race'
          ? Array.from({ length: bet.positions }, () => [])
          : [],
      result: null,
    });
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: betTypeSelectorY.current, animated: true });
    }, 50);
  }

  // ── Bettor handlers ────────────────────────────────────────────────────────

  function handleAddBettor(name: string) {
    const newBettor = createBettor(name);
    newBettor.raceDay = active.raceDay;
    updateTrack(activeTrackId, {
      bettors: [...bettors, newBettor],
      activeBettorId: newBettor.id,
    });
  }

  function handleRenameBettor(id: string, name: string) {
    updateBettors(bettors.map((b) => (b.id === id ? { ...b, name } : b)));
  }

  function handleRemoveBettor(id: string) {
    const remaining = bettors.filter((b) => b.id !== id);
    const newActiveBettorId =
      id === activeBettorId && remaining.length > 0
        ? remaining[remaining.length - 1].id
        : activeBettorId;
    updateTrack(activeTrackId, {
      bettors: remaining,
      activeBettorId: newActiveBettorId,
    });
  }

  // ── Bet / race handlers ────────────────────────────────────────────────────

  function handleRaceDayChange(rd: RaceDaySession) {
    const prev = active.raceDay;
    const raceSwitched = rd.currentRace !== prev.currentRace;
    const firstLastChanged =
      rd.firstRace !== prev.firstRace || rd.lastRace !== prev.lastRace;

    if (raceSwitched) {
      setHorseError(null);
      const clearSelections = {
        selectedBetType: null,
        selectedModifier: null,
        selectedHorses: [],
        selectedLegs: [],
        result: null,
      };
      updateBettors(
        bettors.map((b) => {
          if (b.id === activeBettorId) {
            return { ...b, raceDay: rd, ...clearSelections };
          }
          return {
            ...b,
            ...clearSelections,
            raceDay: {
              ...b.raceDay,
              currentRace: rd.currentRace,
              ...(firstLastChanged
                ? { firstRace: rd.firstRace, lastRace: rd.lastRace }
                : {}),
            },
          };
        }),
      );
    } else {
      const currentRaceNum = rd.currentRace;
      const newRaceConfig = rd.races[currentRaceNum] ?? {
        numHorses: active.numHorses,
        scratchedHorses: [],
      };
      const newScratched = newRaceConfig.scratchedHorses;
      const newNumHorses = newRaceConfig.numHorses;
      const prevScratched = active.raceDay.races[currentRaceNum]?.scratchedHorses ?? [];
      const newlyScratched = newScratched.filter((h) => !prevScratched.includes(h));

      const affectedBettors: Array<{ name: string; count: number }> = [];

      updateBettors(
        bettors.map((b) => {
          const conflictingBets = newlyScratched.length > 0
            ? b.history.filter(
                (e) => e.raceNumber === currentRaceNum && e.horses.some((h) => newlyScratched.includes(h)),
              )
            : [];
          if (conflictingBets.length > 0) {
            affectedBettors.push({ name: b.name, count: conflictingBets.length });
          }
          const cleanHistory = conflictingBets.length > 0
            ? b.history.filter(
                (e) => !(e.raceNumber === currentRaceNum && e.horses.some((h) => newlyScratched.includes(h))),
              )
            : b.history;

          if (b.id === activeBettorId) {
            return {
              ...b,
              raceDay: rd,
              selectedHorses: active.selectedHorses.filter(
                (h) => !newScratched.includes(h) && h <= newNumHorses,
              ),
              result: null,
              history: cleanHistory,
            };
          }
          const bRaceConfig = b.raceDay.races[currentRaceNum] ?? {
            numHorses: b.numHorses,
            scratchedHorses: [],
          };
          return {
            ...b,
            raceDay: {
              ...b.raceDay,
              ...(firstLastChanged
                ? {
                    firstRace: rd.firstRace,
                    lastRace: rd.lastRace,
                    currentRace: Math.min(
                      Math.max(b.raceDay.currentRace, rd.firstRace),
                      rd.lastRace,
                    ),
                  }
                : {}),
              races: {
                ...b.raceDay.races,
                [currentRaceNum]: {
                  ...bRaceConfig,
                  numHorses: newNumHorses,
                  scratchedHorses: newScratched,
                },
              },
            },
            selectedHorses:
              b.raceDay.currentRace === currentRaceNum
                ? b.selectedHorses.filter(
                    (h) => !newScratched.includes(h) && h <= newNumHorses,
                  )
                : b.selectedHorses,
            history: cleanHistory,
          };
        }),
      );

      if (affectedBettors.length > 0) {
        const horseStr = newlyScratched.length === 1
          ? `Horse ${newlyScratched[0]} scratched`
          : `Horses ${newlyScratched.join(', ')} scratched`;
        const bettorStr = affectedBettors
          .map((a) => (a.count > 1 ? `${a.name} (${a.count} bets)` : a.name))
          .join(', ');
        setHorseError(`${horseStr} — bets removed for ${bettorStr}. Please re-enter.`);
      }
    }
  }

  function handleResetApp() {
    const hasBets = state!.tracks.some((t) =>
      t.bettors.some((b) => b.history.length > 0),
    );
    Alert.alert(
      'Reset Everything?',
      hasBets
        ? 'Save today\'s race day to the archive before resetting, or reset without saving.'
        : 'This will clear all tracks, bettors, and bet history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        ...(hasBets
          ? [{
              text: 'Save & Reset',
              onPress: async () => {
                const existing = parseArchive(await AsyncStorage.getItem(ARCHIVE_KEY));
                const updated = addToArchive(existing, state!.tracks);
                await AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
                AsyncStorage.removeItem(STORAGE_KEY);
                setState(buildDefaultState());
              },
            }]
          : []),
        {
          text: hasBets ? 'Reset Without Saving' : 'Reset',
          style: 'destructive' as const,
          onPress: () => {
            AsyncStorage.removeItem(STORAGE_KEY);
            setState(buildDefaultState());
          },
        },
      ],
    );
  }

  function handleDismissOnboarding() {
    AsyncStorage.setItem('bet-slips-native:onboarded', '1').catch(() => {});
    setOnboardingOpen(false);
  }

  async function handleBackup() {
    await exportBackup(state!, require('./package.json').version);
  }

  async function handleRestore() {
    const backup = await importBackup();
    if (!backup) return;
    const backupState = backup.state as AppState;
    const trackCount = backupState.tracks?.length ?? 0;
    const bettorCount = backupState.tracks?.reduce((n, t) => n + (t.bettors?.length ?? 0), 0) ?? 0;
    Alert.alert(
      'Restore Backup?',
      `Found ${trackCount} track${trackCount !== 1 ? 's' : ''} and ${bettorCount} bettor${bettorCount !== 1 ? 's' : ''} (exported ${backup.exportedAt.slice(0, 10)}).\n\nThis will replace all current data. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: () => {
            const migrated = migrateState(backupState as Parameters<typeof migrateState>[0]);
            const restored: AppState = {
              ...migrated,
              templates: backupState.templates ?? [],
            };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(restored)).catch(() => {});
            setState(restored);
            setSettingsOpen(false);
          },
        },
      ],
    );
  }

  function handleToggleHorse(horse: number) {
    const isDeselecting = active.selectedHorses.includes(horse);
    if (
      !isDeselecting &&
      (active.selectedModifier === 'straight' || active.selectedModifier === null)
    ) {
      const bet = BET_TYPES.find((b) => b.id === active.selectedBetType);
      if (bet && active.selectedHorses.length >= bet.positions) {
        const max = bet.positions;
        setHorseError(
          `A straight ${bet.name} uses exactly ${max} horse${max === 1 ? '' : 's'}. Deselect one to swap your pick.`,
        );
        return;
      }
    }
    setHorseError(null);
    updateBettors(
      bettors.map((b) => {
        if (b.id !== activeBettorId) return b;
        return {
          ...b,
          selectedHorses: b.selectedHorses.includes(horse)
            ? b.selectedHorses.filter((h) => h !== horse)
            : [...b.selectedHorses, horse],
          result: null,
        };
      }),
    );
  }

  function handleToggleLegHorse(legIndex: number, horse: number) {
    updateBettors(
      bettors.map((b) => {
        if (b.id !== activeBettorId) return b;
        return {
          ...b,
          selectedLegs: b.selectedLegs.map((leg, i) =>
            i === legIndex
              ? leg.includes(horse)
                ? leg.filter((h) => h !== horse)
                : [...leg, horse]
              : leg,
          ),
          result: null,
        };
      }),
    );
  }

  function handleSelectBetType(id: string) {
    const bet = BET_TYPES.find((b) => b.id === id);
    setHorseError(null);
    updateActive({
      selectedBetType: id,
      selectedHorses: [],
      result: null,
      selectedLegs:
        bet?.category === 'multi-race'
          ? Array.from({ length: bet.positions }, () => [])
          : [],
    });
  }

  function handleSelectModifier(id: ModifierId) {
    setHorseError(null);
    updateActive({ selectedModifier: id, result: null });
  }

  function handleCalculate() {
    if (!active.selectedBetType) return;
    const bet = BET_TYPES.find((b) => b.id === active.selectedBetType)!;

    if (isMultiRace) {
      const sortedLegs = active.selectedLegs.map((l) =>
        [...l].sort((a, b) => a - b),
      );
      const combos = calculateLegCombinations(sortedLegs);
      const totalCost = combos * active.betUnit;
      const combinationList = generateLegCombinationList(sortedLegs);
      const newResult = {
        betType: bet.name,
        modifier: '',
        combinations: combos,
        unitCost: active.betUnit,
        totalCost,
        horses: [],
        legs: sortedLegs,
        combinationList,
        raceNumber: active.raceDay.currentRace,
      };
      updateActive({
        history: [...active.history, newResult],
        selectedBetType: null,
        selectedModifier: null,
        selectedLegs: Array.from({ length: bet.positions }, () => []),
      });
      return;
    }

    if (active.selectedHorses.length === 0) return;

    const effectiveModifier = active.selectedModifier ?? 'straight';
    const orderedHorses =
      effectiveModifier === 'key-horse' || effectiveModifier === 'wheel'
        ? active.selectedHorses
        : [...active.selectedHorses].sort((a, b) => a - b);
    const combos = calculateCombinations(
      active.selectedBetType,
      effectiveModifier,
      orderedHorses,
    );
    const totalCost = combos * active.betUnit;
    const combinationList = generateCombinationList(
      active.selectedBetType,
      effectiveModifier,
      orderedHorses,
    );

    const newResult = {
      betType: bet.name,
      modifier: effectiveModifier
        .replace('-', ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      combinations: combos,
      unitCost: active.betUnit,
      totalCost,
      horses: orderedHorses,
      combinationList,
      raceNumber: active.raceDay.currentRace,
    };
    updateActive({
      history: [...active.history, newResult],
      selectedBetType: null,
      selectedModifier: null,
      selectedHorses: [],
    });
  }

  const canCalculate =
    active.selectedBetType !== null &&
    (isMultiRace
      ? active.selectedLegs.length > 0 &&
        active.selectedLegs.every((l) => l.length > 0)
      : active.selectedHorses.length >=
        getMinHorses(active.selectedBetType, active.selectedModifier));

  const pendingCost =
    canCalculate && active.selectedBetType
      ? isMultiRace
        ? calculateLegCombinations(active.selectedLegs) * active.betUnit
        : calculateCombinations(
            active.selectedBetType,
            active.selectedModifier,
            active.selectedHorses,
          ) * active.betUnit
      : null;

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <Header onReset={handleResetApp} onSettings={() => setSettingsOpen(true)} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TrackSelector
          tracks={tracks}
          activeTrackId={activeTrackId}
          onSelect={(id) => patchState({ activeTrackId: id })}
          onLongPress={(id) => setQuickViewTrackId(id)}
          onAdd={handleAddTrack}
          onRename={handleRenameTrack}
          onRemove={handleRemoveTrack}
        />

        <BettorSelector
          bettors={bettors}
          activeBettorId={activeBettorId}
          scratchConflicts={scratchConflicts}
          unpaidWins={unpaidWins}
          onSelect={(id) => updateTrack(activeTrackId, { activeBettorId: id })}
          onLongPress={(id) => setQuickViewBettorId(id)}
          onAdd={handleAddBettor}
          onRename={handleRenameBettor}
          onRemove={handleRemoveBettor}
        />

        {isRaceLocked && (
          <View style={styles.raceLocked}>
            <Text style={styles.raceLockedText}>
              🔒 Race {rdCurrentRace} results posted
            </Text>
            {rdCurrentRace < active.raceDay.lastRace && (
              <Pressable
                style={styles.advanceBtn}
                onPress={handleAdvanceRace}
              >
                <Text style={styles.advanceBtnText}>
                  Race {rdCurrentRace + 1} →
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <RaceDaySetup
          raceDay={active.raceDay}
          betUnit={active.betUnit}
          budget={active.budget}
          totalSpent={bettorTotal}
          scratchesLocked={isRaceLocked}
          configLocked={isRaceLocked}
          onBetUnitChange={(v) => updateActive({ betUnit: v, result: null })}
          onBudgetChange={(v) => updateActive({ budget: v })}
          onChange={handleRaceDayChange}
        />

        <BetTemplates
          templates={templates}
          currentBetTypeId={active.selectedBetType}
          currentModifier={active.selectedModifier}
          currentBetUnit={active.betUnit}
          mode="apply"
          onApply={handleApplyTemplate}
          onSave={handleSaveTemplate}
          onDelete={handleDeleteTemplate}
        />

        <View onLayout={(e) => { betTypeSelectorY.current = e.nativeEvent.layout.y; }}>
          <BetTypeSelector
            selectedBetType={active.selectedBetType}
            numHorses={effectiveNumHorses}
            disabled={isRaceLocked}
            onSelect={handleSelectBetType}
          />
        </View>

        {!isMultiRace && (
          <ModifierSelector
            selected={active.selectedModifier}
            disabled={isRaceLocked}
            onSelect={handleSelectModifier}
          />
        )}

        {isMultiRace ? (
          <LegSelector
            numHorses={effectiveNumHorses}
            legs={active.selectedLegs}
            onToggle={handleToggleLegHorse}
            legConfigs={legConfigs}
            startRace={rdCurrentRace}
            disabled={isRaceLocked}
          />
        ) : (
          <HorseSelector
            numHorses={effectiveNumHorses}
            selectedHorses={active.selectedHorses}
            scratchedHorses={effectiveScratchedHorses}
            scratchConflicts={scratchConflicts[activeBettorId] ?? []}
            modifier={active.selectedModifier}
            disabled={isRaceLocked}
            onToggle={handleToggleHorse}
          />
        )}

        <BetTemplates
          templates={templates}
          currentBetTypeId={active.selectedBetType}
          currentModifier={active.selectedModifier}
          currentBetUnit={active.betUnit}
          mode="save"
          onApply={handleApplyTemplate}
          onSave={handleSaveTemplate}
          onDelete={handleDeleteTemplate}
        />

        <CalculateButton
          onClick={handleCalculate}
          disabled={!canCalculate}
          pendingCost={pendingCost}
        />

        <BetHistory
          key={activeBettorId}
          history={active.history
            .map((e, i) => ({ entry: e, originalIndex: i }))
            .filter(({ entry }) => entry.raceNumber === rdCurrentRace)}
          bettors={bettors
            .filter((b) =>
              b.history.some((e) => e.raceNumber === rdCurrentRace),
            )
            .map((b) => ({ id: b.id, name: b.name, hasUnpaidWin: unpaidWins[b.id] ?? false }))}
          activeBettorId={activeBettorId}
          onSelectBettor={(id) =>
            updateTrack(activeTrackId, { activeBettorId: id })
          }
          onSlip={() => setSummaryOpen(true)}
          raceNumber={rdCurrentRace}
          results={activeTrack.results}
          locked={isRaceLocked}
          onRemove={(originalIndex) =>
            updateActive({
              history: active.history.filter(
                (_, idx) => idx !== originalIndex,
              ),
            })
          }
          onClearAll={() =>
            updateActive({
              history: active.history.filter(
                (e) => e.raceNumber !== rdCurrentRace,
              ),
            })
          }
          onSetPayout={(originalIndex, payout) => {
            const changedBet = active.history[originalIndex];
            updateBettors(
              bettors.map((b) => ({
                ...b,
                history: b.history.map((e, idx) => {
                  if (b.id === activeBettorId && idx === originalIndex) {
                    return { ...e, payout };
                  }
                  if (
                    b.id !== activeBettorId &&
                    e.raceNumber === changedBet.raceNumber &&
                    e.betType === changedBet.betType &&
                    e.modifier === changedBet.modifier &&
                    e.horses.length === changedBet.horses.length &&
                    e.horses.every((h, i) => h === changedBet.horses[i]) &&
                    checkBetOutcome(e, activeTrack.results) === 'win'
                  ) {
                    return { ...e, payout };
                  }
                  return e;
                }),
              })),
            );
          }}
          onSetNote={(originalIndex, note) =>
            updateActive({
              history: active.history.map((e, idx) =>
                idx === originalIndex ? { ...e, note: note || undefined } : e,
              ),
            })
          }
        />

        {showOutcomePanel && (
          <RaceOutcome
            key={`raceday-${active.raceDay.firstRace}-${active.raceDay.lastRace}`}
            isRaceDay
            firstRace={active.raceDay.firstRace}
            lastRace={active.raceDay.lastRace}
            currentRace={rdCurrentRace}
            races={active.raceDay.races}
            numHorses={active.numHorses}
            results={activeTrack.results}
            superfectaRaces={superfectaRaces}
            onChange={handleResultsChange}
          />
        )}

        {lastRaceComplete && bettors.some((b) => b.history.length > 0) && (
          <View style={styles.daySummaryRow}>
            <Pressable
              style={styles.daySummaryBtn}
              onPress={() => setDaySummaryOpen(true)}
            >
              <Text style={styles.daySummaryBtnText}>🏁 Final Summary</Text>
            </Pressable>
          </View>
        )}

        {/* bottom padding */}
        <View style={{ height: 64 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {daySummaryOpen && (
        <DaySummaryModal
          trackName={activeTrack.name}
          firstRace={active.raceDay.firstRace}
          lastRace={active.raceDay.lastRace}
          summary={summarizeDay(bettors, activeTrack.results)}
          onClose={() => setDaySummaryOpen(false)}
        />
      )}

      {summaryOpen && (
        <BetSummaryModal
          trackName={activeTrack.name}
          raceNumber={rdCurrentRace}
          bettors={bettors}
          onClose={() => setSummaryOpen(false)}
        />
      )}

      {quickViewBettorId && (
        <BettorQuickView
          bettor={bettors.find((b) => b.id === quickViewBettorId)!}
          results={activeTrack.results}
          onClose={() => setQuickViewBettorId(null)}
        />
      )}

      {quickViewTrackId && (
        <TrackQuickView
          track={tracks.find((t) => t.id === quickViewTrackId)!}
          bettors={tracks.find((t) => t.id === quickViewTrackId)!.bettors}
          firstRace={active.raceDay.firstRace}
          lastRace={active.raceDay.lastRace}
          onClose={() => setQuickViewTrackId(null)}
        />
      )}

      {horseError && (
        <ErrorToast
          message={horseError}
          onDismiss={() => setHorseError(null)}
        />
      )}

      <DataManagementModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onBackup={handleBackup}
        onRestore={handleRestore}
        onViewArchive={() => { setSettingsOpen(false); setArchiveOpen(true); }}
        onViewGuide={() => { setSettingsOpen(false); setOnboardingOpen(true); }}
        backupSummary={`${state.tracks.length} track${state.tracks.length !== 1 ? 's' : ''}, ${state.tracks.reduce((n, t) => n + t.bettors.length, 0)} bettor${state.tracks.reduce((n, t) => n + t.bettors.length, 0) !== 1 ? 's' : ''}`}
      />

      <ArchiveModal
        visible={archiveOpen}
        onClose={() => setArchiveOpen(false)}
      />

      <OnboardingModal
        visible={onboardingOpen}
        onDismiss={handleDismissOnboarding}
      />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textDim,
    fontSize: font.md,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xs,
  },
  raceLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warningDim,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  raceLockedText: {
    color: colors.warning,
    fontSize: font.sm,
    fontWeight: '600',
  },
  advanceBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.warning,
  },
  advanceBtnText: {
    color: '#000',
    fontSize: font.sm,
    fontWeight: '700',
  },
  daySummaryRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  daySummaryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  daySummaryBtnText: {
    color: '#fff',
    fontSize: font.md,
    fontWeight: '700',
  },
});
