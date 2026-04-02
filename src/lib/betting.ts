import { BET_TYPES } from '../types';
import type { ModifierId } from '../types';

export function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

export function combinations(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

export function permutations(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / factorial(n - r);
}

export function calculateCombinations(
  betId: string,
  modifier: ModifierId | null,
  horses: number[],
  _keyPosition?: 'top' | 'bottom',
): number {
  const n = horses.length;
  const bet = BET_TYPES.find((b) => b.id === betId);
  if (!bet) return 0;

  const r = bet.positions;

  switch (modifier ?? 'straight') {
    case 'straight':
      return 1;
    case 'box':
      // Quinella is unordered: C(n,2). All others are ordered: P(n,r).
      if (betId === 'quinella') return combinations(n, r);
      return permutations(n, r);
    case 'wheel':
      // Wheel: key horse paired with each remaining horse in one position
      return n - 1;
    case 'part-wheel':
      // Part wheel: key horse with each "with" horse (n-1 selections after key)
      return n - 1;
    case 'key-horse':
      // Full key: key horse covered in every position.
      // Total = positions × P(n-1, r-1)
      return r * permutations(n - 1, r - 1);
    default:
      return 1;
  }
}

export function genPerms(arr: number[], r: number): number[][] {
  if (r === 0) return [[]];
  return arr.flatMap((item, i) =>
    genPerms([...arr.slice(0, i), ...arr.slice(i + 1)], r - 1).map((p) => [
      item,
      ...p,
    ]),
  );
}

export function genCombos(arr: number[], r: number): number[][] {
  if (r === 0) return [[]];
  if (arr.length < r) return [];
  return arr.flatMap((item, i) =>
    genCombos(arr.slice(i + 1), r - 1).map((c) => [item, ...c]),
  );
}

export function generateCombinationList(
  betId: string,
  modifier: ModifierId | null,
  horses: number[],
  keyPosition: 'top' | 'bottom' = 'top',
): number[][] {
  const bet = BET_TYPES.find((b) => b.id === betId);
  if (!bet) return [];
  const r = bet.positions;
  const [key, ...rest] = horses;
  switch (modifier ?? 'straight') {
    case 'straight':
      return [horses.slice(0, r)];
    case 'box':
      // Quinella is unordered pairs; all others are ordered permutations
      if (betId === 'quinella') return genCombos(horses, r);
      return genPerms(horses, r);
    case 'wheel':
    case 'part-wheel':
      // Exacta/Quinella: key position determined by toggle. Quinella ignores
      // position since it's unordered — always emit [key, h] for display.
      if (betId === 'exacta') {
        return rest.map((h) => keyPosition === 'top' ? [key, h] : [h, key]);
      }
      return rest.map((h) => [key, h]);
    case 'key-horse': {
      // Full key: key horse in each position, all permutations of rest fill
      // the remaining slots. No horse appears twice in a single ticket.
      const result: number[][] = [];
      for (let pos = 0; pos < r; pos++) {
        const perms = genPerms(rest, r - 1);
        for (const p of perms) {
          const ticket = [...p.slice(0, pos), key, ...p.slice(pos)];
          result.push(ticket);
        }
      }
      return result;
    }
    default:
      return [];
  }
}

export function getMinHorses(betId: string, modifier: ModifierId | null): number {
  const bet = BET_TYPES.find((b) => b.id === betId);
  if (!bet) return 1;
  // Box needs at least positions+1 horses to be meaningful (otherwise it's
  // identical to straight). Quinella box minimum is 3.
  if (modifier === 'box') return betId === 'quinella' ? 3 : bet.positions + 1;
  // Key/wheel/part-wheel: need the key horse + at least 1 "with" horse
  if (modifier === 'key-horse' || modifier === 'wheel' || modifier === 'part-wheel') return 2;
  return bet.positions;
}

// Positional part-wheel: cross-product of positions, discard tickets where
// any horse appears more than once (a horse can't finish in two positions).
export function generatePositionalCombos(positions: number[][]): number[][] {
  return positions
    .reduce<number[][]>(
      (acc, pos) => acc.flatMap((combo) => pos.map((h) => [...combo, h])),
      [[]],
    )
    .filter((ticket) => new Set(ticket).size === ticket.length);
}

export function calculatePositionalCombinations(positions: number[][]): number {
  return generatePositionalCombos(positions).length;
}

export function calculateLegCombinations(legs: number[][]): number {
  return legs.reduce((acc, leg) => acc * leg.length, 1);
}

export function generateLegCombinationList(legs: number[][]): number[][] {
  return legs.reduce<number[][]>(
    (acc, leg) => acc.flatMap((combo) => leg.map((horse) => [...combo, horse])),
    [[]],
  );
}
