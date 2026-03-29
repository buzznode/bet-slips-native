import type { BetResult, RaceResult } from '../types';

export type OutcomeStatus = 'win' | 'loss' | 'pending';

export const STANDARD_RACE_KEY = 0;

export function checkBetOutcome(
  entry: BetResult,
  results: Record<number, RaceResult>,
): OutcomeStatus {
  const raceKey = entry.raceNumber ?? STANDARD_RACE_KEY;

  if (entry.legs && entry.legs.length > 0) {
    if (entry.raceNumber === undefined) return 'pending';

    for (let i = 0; i < entry.legs.length; i++) {
      const r = results[raceKey + i];
      if (!r || r.first === null) return 'pending';
    }

    const wins = entry.combinationList.some((combo) =>
      combo.every((horse, i) => horse === results[raceKey + i].first),
    );
    return wins ? 'win' : 'loss';
  }

  const result = results[raceKey];
  if (!result || result.first === null) return 'pending';

  const { first, second, third } = result;
  const combos = entry.combinationList;
  const bt = entry.betType.toLowerCase();

  switch (bt) {
    case 'win':
      return combos.some((c) => c[0] === first) ? 'win' : 'loss';

    case 'place':
      if (second === null) return 'pending';
      return combos.some((c) => c[0] === first || c[0] === second)
        ? 'win'
        : 'loss';

    case 'show':
    case 'across the board':
      if (second === null || third === null) return 'pending';
      return combos.some(
        (c) => c[0] === first || c[0] === second || c[0] === third,
      )
        ? 'win'
        : 'loss';

    case 'exacta':
      if (second === null) return 'pending';
      return combos.some((c) => c[0] === first && c[1] === second)
        ? 'win'
        : 'loss';

    case 'quinella':
      if (second === null) return 'pending';
      return combos.some((c) => {
        const [a, b] = [...c].sort((x, y) => x - y);
        const [r1, r2] = [first, second].sort((x, y) => x - y);
        return a === r1 && b === r2;
      })
        ? 'win'
        : 'loss';

    case 'trifecta':
      if (second === null || third === null) return 'pending';
      return combos.some(
        (c) => c[0] === first && c[1] === second && c[2] === third,
      )
        ? 'win'
        : 'loss';

    case 'superfecta':
      if (second === null || third === null || result.fourth === null)
        return 'pending';
      return combos.some(
        (c) =>
          c[0] === first &&
          c[1] === second &&
          c[2] === third &&
          c[3] === result.fourth,
      )
        ? 'win'
        : 'loss';

    default:
      return 'pending';
  }
}

export interface BettorDaySummary {
  id: string;
  name: string;
  races: number;
  wins: number;
  losses: number;
  totalBets: number;
  totalBet: number;
  wonBets: number;
  totalWon: number;
  hasPayouts: boolean;
}

export interface DaySummary {
  bettors: BettorDaySummary[];
  totals: Omit<BettorDaySummary, 'id' | 'name'>;
}

export function summarizeDay(
  bettors: import('../types').BettorState[],
  results: Record<number, RaceResult>,
): DaySummary {
  const bettorSummaries: BettorDaySummary[] = bettors
    .filter((b) => b.history.length > 0)
    .map((b) => {
      const races = new Set(b.history.map((e) => e.raceNumber ?? 0)).size;
      let wins = 0, losses = 0, totalBet = 0, wonBets = 0, totalWon = 0, hasPayouts = false;
      for (const entry of b.history) {
        const outcome = checkBetOutcome(entry, results);
        if (outcome === 'win') wins++;
        else if (outcome === 'loss') losses++;
        totalBet += entry.totalCost;
        if (entry.payout !== undefined) {
          wonBets++;
          totalWon += entry.payout;
          hasPayouts = true;
        }
      }
      return { id: b.id, name: b.name, races, wins, losses, totalBets: b.history.length, totalBet, wonBets, totalWon, hasPayouts };
    });

  const totals = bettorSummaries.reduce(
    (acc, b) => ({
      races: new Set([
        ...bettors.flatMap((bt) => bt.history.map((e) => e.raceNumber ?? 0)),
      ]).size,
      wins: acc.wins + b.wins,
      losses: acc.losses + b.losses,
      totalBets: acc.totalBets + b.totalBets,
      totalBet: acc.totalBet + b.totalBet,
      wonBets: acc.wonBets + b.wonBets,
      totalWon: acc.totalWon + b.totalWon,
      hasPayouts: acc.hasPayouts || b.hasPayouts,
    }),
    { races: 0, wins: 0, losses: 0, totalBets: 0, totalBet: 0, wonBets: 0, totalWon: 0, hasPayouts: false },
  );

  const allRaces = new Set(
    bettors.flatMap((b) => b.history.map((e) => e.raceNumber ?? 0)),
  ).size;
  totals.races = allRaces;

  return { bettors: bettorSummaries, totals };
}
