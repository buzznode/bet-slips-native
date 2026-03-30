import { buildSlipText } from '../lib/share';
import type { BettorState } from '../types';

const makeBettor = (id: string, name: string, bets: Partial<import('../types').BetResult>[]): BettorState => ({
  id,
  name,
  numHorses: 8,
  betUnit: 1,
  selectedBetType: null,
  selectedModifier: null,
  selectedHorses: [],
  selectedLegs: [],
  result: null,
  raceDay: { firstRace: 1, lastRace: 10, currentRace: 1, races: {} },
  history: bets.map((b) => ({
    betType: 'Win',
    modifier: 'Straight',
    combinations: 1,
    unitCost: 2,
    totalCost: 2,
    horses: [1],
    combinationList: [[1]],
    raceNumber: 1,
    ...b,
  })),
});

describe('buildSlipText', () => {
  it('includes track name and race number in header', () => {
    const bettor = makeBettor('1', 'Brad', []);
    const text = buildSlipText('Santa Anita', 3, [bettor]);
    expect(text).toContain('Santa Anita');
    expect(text).toContain('Race 3');
  });

  it('excludes bettors with no bets in the race', () => {
    const bettor = makeBettor('1', 'Brad', [{ raceNumber: 2 }]);
    const text = buildSlipText('Santa Anita', 1, [bettor]);
    expect(text).not.toContain('Brad');
  });

  it('includes bettor name and subtotal', () => {
    const bettor = makeBettor('1', 'Brad', [{ totalCost: 4, unitCost: 2, combinations: 2, raceNumber: 1 }]);
    const text = buildSlipText('Santa Anita', 1, [bettor]);
    expect(text).toContain('Brad');
    expect(text).toContain('$4.00');
  });

  it('includes grand total', () => {
    const b1 = makeBettor('1', 'Brad', [{ totalCost: 4, raceNumber: 1 }]);
    const b2 = makeBettor('2', 'Karen', [{ totalCost: 6, raceNumber: 1 }]);
    const text = buildSlipText('Churchill Downs', 1, [b1, b2]);
    expect(text).toContain('Grand Total: $10.00');
  });

  it('omits Straight modifier from bet label', () => {
    const bettor = makeBettor('1', 'Brad', [{ betType: 'Exacta', modifier: 'Straight', raceNumber: 1 }]);
    const text = buildSlipText('Santa Anita', 1, [bettor]);
    expect(text).toContain('Exacta');
    expect(text).not.toContain('(Straight)');
  });

  it('includes non-Straight modifier in bet label', () => {
    const bettor = makeBettor('1', 'Brad', [{ betType: 'Exacta', modifier: 'Box', raceNumber: 1 }]);
    const text = buildSlipText('Santa Anita', 1, [bettor]);
    expect(text).toContain('Exacta (Box)');
  });

  it('formats multi-race legs', () => {
    const bettor = makeBettor('1', 'Brad', [{
      betType: 'Pick 3',
      modifier: 'Straight',
      legs: [[1, 2], [3], [4, 5]],
      horses: [],
      raceNumber: 1,
    }]);
    const text = buildSlipText('Santa Anita', 1, [bettor]);
    expect(text).toContain('R1: 1,2');
    expect(text).toContain('R2: 3');
    expect(text).toContain('R3: 4,5');
  });
});
