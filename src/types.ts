export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export type BetCategory = 'straight' | 'exotic' | 'multi-race';

export interface BetType {
  id: string;
  name: string;
  description: string;
  category: BetCategory;
  minHorses: number;
  positions: number;
}

export type ModifierId =
  | 'straight'
  | 'box'
  | 'wheel'
  | 'part-wheel'
  | 'key-horse';

export interface Modifier {
  id: ModifierId;
  name: string;
}

export interface RaceConfig {
  numHorses: number;
  scratchedHorses: number[];
}

export interface RaceDaySession {
  firstRace: number;
  lastRace: number;
  currentRace: number;
  races: Record<number, RaceConfig>;
}

function createDefaultRaces(
  first: number,
  last: number,
): Record<number, RaceConfig> {
  const races: Record<number, RaceConfig> = {};
  for (let i = first; i <= last; i++) {
    races[i] = { numHorses: 8, scratchedHorses: [] };
  }
  return races;
}

export function createRaceDaySession(): RaceDaySession {
  return {
    firstRace: 1,
    lastRace: 10,
    currentRace: 1,
    races: createDefaultRaces(1, 10),
  };
}

export interface BetResult {
  betType: string;
  modifier: string;
  combinations: number;
  unitCost: number;
  totalCost: number;
  horses: number[];
  legs?: number[][];
  combinationList: number[][];
  raceNumber?: number;
  payout?: number;
}

export interface BettorState {
  id: string;
  name: string;
  numHorses: number;
  betUnit: number;
  budget?: number;
  selectedBetType: string | null;
  selectedModifier: ModifierId | null;
  selectedHorses: number[];
  selectedLegs: number[][];
  result: BetResult | null;
  history: BetResult[];
  raceDay: RaceDaySession;
}

export function createBettor(name: string): BettorState {
  return {
    id: uuid(),
    name,
    numHorses: 8,
    betUnit: 1.0,
    selectedBetType: null,
    selectedModifier: null,
    selectedHorses: [],
    selectedLegs: [],
    result: null,
    history: [],
    raceDay: createRaceDaySession(),
  };
}

export interface RaceResult {
  first: number | null;
  second: number | null;
  third: number | null;
  fourth: number | null;
}

export interface TrackSession {
  id: string;
  name: string;
  bettors: BettorState[];
  activeBettorId: string;
  results: Record<number, RaceResult>;
  scratchedHorses: number[];
}

export function createTrack(name: string): TrackSession {
  const firstBettor = createBettor('Me');
  return {
    id: uuid(),
    results: {},
    scratchedHorses: [],
    name,
    bettors: [firstBettor],
    activeBettorId: firstBettor.id,
  };
}

export const BET_TYPES: BetType[] = [
  { id: 'win', name: 'Win', description: '1 horse finishes 1st', category: 'straight', minHorses: 2, positions: 1 },
  { id: 'place', name: 'Place', description: '1 horse finishes 1st or 2nd', category: 'straight', minHorses: 2, positions: 1 },
  { id: 'show', name: 'Show', description: '1 horse finishes 1st, 2nd, or 3rd', category: 'straight', minHorses: 3, positions: 1 },
  { id: 'across-the-board', name: 'Across the Board', description: 'Win + Place + Show on 1 horse', category: 'straight', minHorses: 3, positions: 1 },
  { id: 'exacta', name: 'Exacta', description: '1st & 2nd in exact order', category: 'exotic', minHorses: 2, positions: 2 },
  { id: 'quinella', name: 'Quinella', description: '1st & 2nd in any order', category: 'exotic', minHorses: 2, positions: 2 },
  { id: 'trifecta', name: 'Trifecta', description: '1st, 2nd & 3rd in exact order', category: 'exotic', minHorses: 3, positions: 3 },
  { id: 'superfecta', name: 'Superfecta', description: '1st–4th in exact order', category: 'exotic', minHorses: 4, positions: 4 },
  { id: 'daily-double', name: 'Daily Double', description: 'Winner of 2 consecutive races', category: 'multi-race', minHorses: 2, positions: 2 },
  { id: 'pick-3', name: 'Pick 3', description: 'Winner of 3 consecutive races', category: 'multi-race', minHorses: 2, positions: 3 },
  { id: 'pick-4', name: 'Pick 4', description: 'Winner of 4 consecutive races', category: 'multi-race', minHorses: 2, positions: 4 },
  { id: 'pick-5', name: 'Pick 5', description: 'Winner of 5 consecutive races', category: 'multi-race', minHorses: 2, positions: 5 },
  { id: 'pick-6', name: 'Pick 6', description: 'Winner of 6 consecutive races', category: 'multi-race', minHorses: 2, positions: 6 },
];

export const MODIFIERS: Modifier[] = [
  { id: 'straight', name: 'Straight' },
  { id: 'box', name: 'Box' },
  { id: 'wheel', name: 'Wheel' },
  { id: 'part-wheel', name: 'Part Wheel' },
  { id: 'key-horse', name: 'Key Horse' },
];

export interface BetTemplate {
  id: string;
  name: string;
  betTypeId: string;
  modifier: ModifierId;
  betUnit: number;
}
