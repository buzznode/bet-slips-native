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
): number {
  const n = horses.length;
  const bet = BET_TYPES.find((b) => b.id === betId);
  if (!bet) return 0;

  const r = bet.positions;

  switch (modifier ?? 'straight') {
    case 'straight':
      return 1;
    case 'box':
      return permutations(n, r);
    case 'wheel':
      return permutations(n - 1, r - 1);
    case 'part-wheel':
      return combinations(n, r - 1);
    case 'key-horse':
      return permutations(n - 1, r - 1);
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
): number[][] {
  const bet = BET_TYPES.find((b) => b.id === betId);
  if (!bet) return [];
  const r = bet.positions;
  const [key, ...rest] = horses;
  switch (modifier ?? 'straight') {
    case 'straight':
      return [horses.slice(0, r)];
    case 'box':
      return genPerms(horses, r);
    case 'wheel':
    case 'key-horse':
      return genPerms(rest, r - 1).map((p) => [key, ...p]);
    case 'part-wheel':
      return genCombos(rest, r - 1).map((c) => [key, ...c]);
    default:
      return [];
  }
}

export function getMinHorses(betId: string, modifier: ModifierId | null): number {
  const bet = BET_TYPES.find((b) => b.id === betId);
  if (!bet) return 1;
  if (betId === 'quinella' && modifier === 'box') return 3;
  return bet.positions;
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
