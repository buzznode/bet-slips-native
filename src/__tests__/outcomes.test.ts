import { checkBetOutcome } from '../lib/outcomes';
import type { BetResult, RaceResult } from '../types';

function makeBet(overrides: Partial<BetResult>): BetResult {
  return {
    betType: 'Win',
    modifier: 'Straight',
    combinations: 1,
    unitCost: 1,
    totalCost: 1,
    horses: [3],
    combinationList: [[3]],
    ...overrides,
  };
}

function makeResult(
  first: number | null,
  second: number | null = null,
  third: number | null = null,
  fourth: number | null = null,
): RaceResult {
  return { first, second, third, fourth };
}

describe('checkBetOutcome — Win', () => {
  it('returns pending when no result entered', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Win', combinationList: [[3]] }), {})).toBe('pending');
  });

  it('returns win when horse finishes 1st', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Win', combinationList: [[3]] }), { 0: makeResult(3) })).toBe('win');
  });

  it('returns loss when horse does not finish 1st', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Win', combinationList: [[3]] }), { 0: makeResult(5) })).toBe('loss');
  });

  it('Win box wins if any selected horse finishes 1st', () => {
    const entry = makeBet({ betType: 'Win', horses: [3, 5], combinationList: [[3], [5]] });
    expect(checkBetOutcome(entry, { 0: makeResult(5) })).toBe('win');
    expect(checkBetOutcome(entry, { 0: makeResult(7) })).toBe('loss');
  });
});

describe('checkBetOutcome — Place', () => {
  it('returns pending when 2nd not entered', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Place', combinationList: [[3]] }), { 0: makeResult(5, null) })).toBe('pending');
  });

  it('wins finishing 1st', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Place', combinationList: [[3]] }), { 0: makeResult(3, 5) })).toBe('win');
  });

  it('wins finishing 2nd', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Place', combinationList: [[3]] }), { 0: makeResult(5, 3) })).toBe('win');
  });

  it('loses finishing 3rd', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Place', combinationList: [[3]] }), { 0: makeResult(5, 7, 3) })).toBe('loss');
  });
});

describe('checkBetOutcome — Show', () => {
  it('returns pending when 3rd not entered', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Show', combinationList: [[3]] }), { 0: makeResult(5, 7, null) })).toBe('pending');
  });

  it('wins finishing 1st, 2nd, or 3rd', () => {
    const entry = makeBet({ betType: 'Show', combinationList: [[3]] });
    expect(checkBetOutcome(entry, { 0: makeResult(3, 5, 7) })).toBe('win');
    expect(checkBetOutcome(entry, { 0: makeResult(5, 3, 7) })).toBe('win');
    expect(checkBetOutcome(entry, { 0: makeResult(5, 7, 3) })).toBe('win');
  });

  it('loses finishing out of the money', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Show', combinationList: [[3]] }), { 0: makeResult(5, 7, 1) })).toBe('loss');
  });
});

describe('checkBetOutcome — Exacta', () => {
  it('straight: wins with exact order', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Exacta', combinationList: [[3, 5]] }), { 0: makeResult(3, 5) })).toBe('win');
  });

  it('straight: loses when order is reversed', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Exacta', combinationList: [[3, 5]] }), { 0: makeResult(5, 3) })).toBe('loss');
  });

  it('box: wins in either order', () => {
    const entry = makeBet({ betType: 'Exacta', combinationList: [[3, 5], [5, 3]] });
    expect(checkBetOutcome(entry, { 0: makeResult(5, 3) })).toBe('win');
    expect(checkBetOutcome(entry, { 0: makeResult(3, 5) })).toBe('win');
    expect(checkBetOutcome(entry, { 0: makeResult(3, 7) })).toBe('loss');
  });
});

describe('checkBetOutcome — Quinella', () => {
  it('wins when horses finish 1st and 2nd in any order', () => {
    const entry = makeBet({ betType: 'Quinella', combinationList: [[3, 5]] });
    expect(checkBetOutcome(entry, { 0: makeResult(3, 5) })).toBe('win');
    expect(checkBetOutcome(entry, { 0: makeResult(5, 3) })).toBe('win');
  });

  it('loses when neither or only one horse finishes in top 2', () => {
    const entry = makeBet({ betType: 'Quinella', combinationList: [[3, 5]] });
    expect(checkBetOutcome(entry, { 0: makeResult(3, 7) })).toBe('loss');
    expect(checkBetOutcome(entry, { 0: makeResult(7, 9) })).toBe('loss');
  });
});

describe('checkBetOutcome — Trifecta', () => {
  it('straight: wins with exact 1-2-3 order', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Trifecta', combinationList: [[3, 5, 7]] }), { 0: makeResult(3, 5, 7) })).toBe('win');
  });

  it('straight: loses when order differs', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Trifecta', combinationList: [[3, 5, 7]] }), { 0: makeResult(3, 7, 5) })).toBe('loss');
  });

  it('box: wins in any of the covered orders', () => {
    const entry = makeBet({
      betType: 'Trifecta',
      combinationList: [[3,5,7],[3,7,5],[5,3,7],[5,7,3],[7,3,5],[7,5,3]],
    });
    expect(checkBetOutcome(entry, { 0: makeResult(7, 3, 5) })).toBe('win');
    expect(checkBetOutcome(entry, { 0: makeResult(1, 3, 5) })).toBe('loss');
  });

  it('returns pending when 3rd not entered', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Trifecta', combinationList: [[3, 5, 7]] }), { 0: makeResult(3, 5, null) })).toBe('pending');
  });
});

describe('checkBetOutcome — Multi-race', () => {
  it('returns pending in standard mode (no raceNumber)', () => {
    const entry = makeBet({
      betType: 'Daily Double',
      modifier: '',
      horses: [],
      legs: [[3, 5], [7]],
      combinationList: [[3, 7], [5, 7]],
    });
    expect(checkBetOutcome(entry, { 1: makeResult(3), 2: makeResult(7) })).toBe('pending');
  });

  it('returns pending when a required race result is missing', () => {
    const entry = makeBet({
      betType: 'Daily Double',
      modifier: '',
      horses: [],
      legs: [[3, 5], [7]],
      combinationList: [[3, 7], [5, 7]],
      raceNumber: 3,
    });
    expect(checkBetOutcome(entry, { 3: makeResult(3) })).toBe('pending');
  });

  it('wins when every leg includes the race winner', () => {
    const entry = makeBet({
      betType: 'Daily Double',
      modifier: '',
      horses: [],
      legs: [[3, 5], [7]],
      combinationList: [[3, 7], [5, 7]],
      raceNumber: 3,
    });
    expect(checkBetOutcome(entry, { 3: makeResult(3), 4: makeResult(7) })).toBe('win');
  });

  it('loses when any leg does not include the race winner', () => {
    const entry = makeBet({
      betType: 'Daily Double',
      modifier: '',
      horses: [],
      legs: [[3, 5], [7]],
      combinationList: [[3, 7], [5, 7]],
      raceNumber: 3,
    });
    expect(checkBetOutcome(entry, { 3: makeResult(1), 4: makeResult(7) })).toBe('loss');
  });

  it('Pick 3 — wins when all three legs cover the winners', () => {
    const entry = makeBet({
      betType: 'Pick 3',
      modifier: '',
      horses: [],
      legs: [[1], [4], [6]],
      combinationList: [[1, 4, 6]],
      raceNumber: 5,
    });
    expect(checkBetOutcome(entry, { 5: makeResult(1), 6: makeResult(4), 7: makeResult(6) })).toBe('win');
  });
});

describe('checkBetOutcome — Across the Board', () => {
  it('returns pending when 3rd not entered', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Across the Board', combinationList: [[4]] }), { 0: makeResult(4, 2, null) })).toBe('pending');
  });

  it('wins finishing 1st', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Across the Board', combinationList: [[4]] }), { 0: makeResult(4, 2, 6) })).toBe('win');
  });

  it('wins finishing 2nd', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Across the Board', combinationList: [[4]] }), { 0: makeResult(1, 4, 6) })).toBe('win');
  });

  it('wins finishing 3rd', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Across the Board', combinationList: [[4]] }), { 0: makeResult(1, 2, 4) })).toBe('win');
  });

  it('loses finishing out of the money', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Across the Board', combinationList: [[4]] }), { 0: makeResult(1, 2, 6) })).toBe('loss');
  });
});

describe('checkBetOutcome — Superfecta', () => {
  it('returns pending when no results', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Superfecta', combinationList: [[1, 2, 3, 4]] }), {})).toBe('pending');
  });

  it('returns pending when fourth is null', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Superfecta', combinationList: [[1, 2, 3, 4]] }), { 0: makeResult(1, 2, 3) })).toBe('pending');
  });

  it('wins when straight combo matches all 4 positions', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Superfecta', combinationList: [[1, 2, 3, 4]] }), { 0: makeResult(1, 2, 3, 4) })).toBe('win');
  });

  it('loses when 4th place does not match', () => {
    expect(checkBetOutcome(makeBet({ betType: 'Superfecta', combinationList: [[1, 2, 3, 4]] }), { 0: makeResult(1, 2, 3, 5) })).toBe('loss');
  });

  it('wins box when combo list includes the matching order', () => {
    const entry = makeBet({
      betType: 'Superfecta',
      combinationList: [[1,2,3,4],[1,2,4,3],[1,3,2,4],[1,3,4,2],[1,4,2,3],[1,4,3,2]],
    });
    expect(checkBetOutcome(entry, { 0: makeResult(1, 4, 2, 3) })).toBe('win');
  });
});
