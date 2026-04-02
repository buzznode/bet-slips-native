import {
  factorial,
  combinations,
  permutations,
  calculateCombinations,
  generateCombinationList,
  calculateLegCombinations,
  generateLegCombinationList,
  getMinHorses,
  generatePositionalCombos,
  calculatePositionalCombinations,
} from '../lib/betting';

describe('factorial', () => {
  it('returns 1 for 0 and 1', () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(1)).toBe(1);
  });

  it('computes correctly for common values', () => {
    expect(factorial(3)).toBe(6);
    expect(factorial(4)).toBe(24);
    expect(factorial(5)).toBe(120);
  });
});

describe('permutations', () => {
  it('returns 0 when r > n', () => {
    expect(permutations(2, 3)).toBe(0);
  });

  it('P(4,2) = 12', () => {
    expect(permutations(4, 2)).toBe(12);
  });

  it('P(4,3) = 24', () => {
    expect(permutations(4, 3)).toBe(24);
  });
});

describe('combinations', () => {
  it('returns 0 when r > n', () => {
    expect(combinations(2, 3)).toBe(0);
  });

  it('C(4,2) = 6', () => {
    expect(combinations(4, 2)).toBe(6);
  });

  it('C(6,3) = 20', () => {
    expect(combinations(6, 3)).toBe(20);
  });
});

describe('calculateCombinations', () => {
  describe('straight bet (Win)', () => {
    it('always returns 1 regardless of horse count', () => {
      expect(calculateCombinations('win', 'straight', [3])).toBe(1);
      expect(calculateCombinations('win', 'straight', [1, 2, 3])).toBe(1);
    });
  });

  describe('exacta (2 positions)', () => {
    it('box: 3 horses = 6 combinations (P(3,2))', () => {
      expect(calculateCombinations('exacta', 'box', [1, 2, 3])).toBe(6);
    });

    it('box: 4 horses = 12 combinations (P(4,2))', () => {
      expect(calculateCombinations('exacta', 'box', [1, 2, 3, 4])).toBe(12);
    });

    it('wheel: 4 horses = 3 combinations (P(3,1))', () => {
      expect(calculateCombinations('exacta', 'wheel', [1, 2, 3, 4])).toBe(3);
    });

    it('key-horse: 4 horses = 6 combinations (key covers both positions: 2*(4-1))', () => {
      expect(calculateCombinations('exacta', 'key-horse', [1, 2, 3, 4])).toBe(6);
    });
  });

  describe('trifecta (3 positions)', () => {
    it('box: 4 horses = 24 combinations (P(4,3))', () => {
      expect(calculateCombinations('trifecta', 'box', [1, 3, 5, 7])).toBe(24);
    });

    it('key-horse: 4 horses = full key = 3 × P(3,2) = 18', () => {
      expect(calculateCombinations('trifecta', 'key-horse', [4, 5, 6, 7])).toBe(18);
    });

    it('part-wheel: key + 3 with-horses = 3 combos', () => {
      expect(calculateCombinations('trifecta', 'part-wheel', [4, 5, 6, 7])).toBe(3);
    });
  });

  describe('superfecta (4 positions)', () => {
    it('box: 4 horses = 24 combinations (P(4,4))', () => {
      expect(calculateCombinations('superfecta', 'box', [1, 2, 3, 4])).toBe(24);
    });
  });

  describe('unknown bet id', () => {
    it('returns 0', () => {
      expect(calculateCombinations('fake-bet', 'box', [1, 2, 3])).toBe(0);
    });
  });
});

describe('generateCombinationList', () => {
  describe('straight', () => {
    it('returns 1 combo containing the first r horses', () => {
      const list = generateCombinationList('exacta', 'straight', [2, 5]);
      expect(list).toEqual([[2, 5]]);
    });
  });

  describe('box (exacta)', () => {
    it('returns all ordered permutations', () => {
      const list = generateCombinationList('exacta', 'box', [1, 2, 3]);
      expect(list).toHaveLength(6);
      expect(list).toContainEqual([1, 2]);
      expect(list).toContainEqual([2, 1]);
      expect(list).toContainEqual([3, 1]);
    });
  });

  describe('key-horse (trifecta)', () => {
    it('full key: 4 horses = 18 combos covering all 3 positions', () => {
      const list = generateCombinationList('trifecta', 'key-horse', [4, 5, 6, 7]);
      expect(list).toHaveLength(18);
    });

    it('key horse appears exactly once in every ticket', () => {
      const list = generateCombinationList('trifecta', 'key-horse', [4, 5, 6, 7]);
      list.forEach((combo) => {
        expect(combo.filter((h) => h === 4)).toHaveLength(1);
      });
    });

    it('key horse appears in each position across all tickets', () => {
      const list = generateCombinationList('trifecta', 'key-horse', [4, 5, 6, 7]);
      expect(list.some((c) => c[0] === 4)).toBe(true);
      expect(list.some((c) => c[1] === 4)).toBe(true);
      expect(list.some((c) => c[2] === 4)).toBe(true);
    });
  });

  describe('wheel (exacta)', () => {
    it('key horse is always in position 1', () => {
      const list = generateCombinationList('exacta', 'wheel', [1, 2, 3, 4]);
      expect(list).toHaveLength(3);
      list.forEach((combo) => expect(combo[0]).toBe(1));
    });
  });

  describe('part-wheel (trifecta)', () => {
    it('key in position 1, remaining in unordered combinations', () => {
      const list = generateCombinationList('trifecta', 'part-wheel', [4, 5, 6, 7]);
      expect(list).toHaveLength(3);
      list.forEach((combo) => expect(combo[0]).toBe(4));
    });
  });

  describe('unknown bet id', () => {
    it('returns empty array', () => {
      expect(generateCombinationList('fake-bet', 'box', [1, 2])).toEqual([]);
    });
  });
});

describe('calculateLegCombinations', () => {
  it('returns product of all leg counts', () => {
    expect(calculateLegCombinations([[1, 2], [3], [4, 5, 6]])).toBe(6);
  });

  it('daily double: 1 horse each leg = 1 ticket', () => {
    expect(calculateLegCombinations([[5], [3]])).toBe(1);
  });

  it('pick 4 example: 2×3×3×2 = 36', () => {
    expect(calculateLegCombinations([[1, 2], [1, 2, 3], [1, 2, 3], [1, 2]])).toBe(36);
  });

  it('pick 4 mixed: 1×3×1×2 = 6', () => {
    expect(calculateLegCombinations([[1], [1, 2, 3], [4], [5, 6]])).toBe(6);
  });
});

describe('generateLegCombinationList', () => {
  it('daily double produces cartesian product', () => {
    const list = generateLegCombinationList([[1, 2], [3, 4]]);
    expect(list).toHaveLength(4);
    expect(list).toContainEqual([1, 3]);
    expect(list).toContainEqual([1, 4]);
    expect(list).toContainEqual([2, 3]);
    expect(list).toContainEqual([2, 4]);
  });

  it('pick 3 with one horse per leg = single ticket', () => {
    const list = generateLegCombinationList([[1], [2], [3]]);
    expect(list).toEqual([[1, 2, 3]]);
  });

  it('count matches calculateLegCombinations', () => {
    const legs = [[1, 2], [3, 4, 5], [6]];
    expect(generateLegCombinationList(legs)).toHaveLength(
      calculateLegCombinations(legs),
    );
  });
});

describe('getMinHorses', () => {
  it('returns positions for standard bet+modifier combos', () => {
    expect(getMinHorses('trifecta', 'straight')).toBe(3);
    expect(getMinHorses('trifecta', 'box')).toBe(4);
    expect(getMinHorses('exacta', 'wheel')).toBe(2);
    expect(getMinHorses('superfecta', 'box')).toBe(5);
  });

  it('returns 2 for quinella straight', () => {
    expect(getMinHorses('quinella', 'straight')).toBe(2);
  });

  it('returns 3 for quinella box', () => {
    expect(getMinHorses('quinella', 'box')).toBe(3);
  });

  it('returns 1 for unknown bet id', () => {
    expect(getMinHorses('unknown', 'straight')).toBe(1);
  });
});

describe('generatePositionalCombos', () => {
  it('2×2×2 with only 2 distinct horses yields 0 valid tickets', () => {
    // Only horses 1 and 2 available — impossible to fill 3 distinct positions
    const combos = generatePositionalCombos([[1, 2], [1, 2], [1, 2]]);
    expect(combos).toHaveLength(0);
  });

  it('3×3×3 with 3 distinct horses yields 6 valid tickets (all permutations)', () => {
    const combos = generatePositionalCombos([[1, 2, 3], [1, 2, 3], [1, 2, 3]]);
    expect(combos).toHaveLength(6);
    combos.forEach((ticket) => expect(new Set(ticket).size).toBe(3));
  });

  it('no horse appears twice in a single ticket', () => {
    const combos = generatePositionalCombos([[1, 2, 3], [1, 2, 3], [1, 2, 3]]);
    combos.forEach((ticket) => expect(new Set(ticket).size).toBe(ticket.length));
  });

  it('locked horse in position 1 eliminates conflicts', () => {
    // 1st: only horse 1 — so horse 1 is locked and excluded from other positions
    const combos = generatePositionalCombos([[1], [2, 3], [2, 3]]);
    // 1st is always 1; 2nd/3rd must differ → [1,2,3] and [1,3,2] = 2 tickets
    expect(combos).toHaveLength(2);
    combos.forEach((ticket) => expect(ticket[0]).toBe(1));
  });

  it('returns 0 when same horse locked in two positions', () => {
    const combos = generatePositionalCombos([[1], [1], [2, 3]]);
    expect(combos).toHaveLength(0);
  });

  it('superfecta 4 positions: 1×4×4×4 with single lock', () => {
    const combos = generatePositionalCombos([[1], [2, 3, 4, 5], [2, 3, 4, 5], [2, 3, 4, 5]]);
    // Key=1 locked in 1st; 2nd/3rd/4th pick from {2,3,4,5} with no repeats = P(4,3) = 24
    expect(combos).toHaveLength(24);
    combos.forEach((ticket) => expect(new Set(ticket).size).toBe(4));
  });

  it('example from spreadsheet: 1,2 / 1,2,3 / 4,5 for trifecta', () => {
    const combos = generatePositionalCombos([[1, 2], [1, 2, 3], [4, 5]]);
    // 3rd position (4,5) never overlaps with 1st/2nd (1,2,3), so only constraint
    // is p1 ≠ p2. p1=1 → p2 ∈ {2,3}, p1=2 → p2 ∈ {1,3} → 4 pairs × 2 for p3 = 8
    expect(combos).toHaveLength(8);
    combos.forEach((ticket) => {
      expect([4, 5]).toContain(ticket[2]);
      expect(new Set(ticket).size).toBe(3);
    });
  });
});

describe('calculatePositionalCombinations', () => {
  it('matches generatePositionalCombos length', () => {
    const positions = [[1, 2], [1, 2, 3], [3, 4, 5]];
    expect(calculatePositionalCombinations(positions)).toBe(
      generatePositionalCombos(positions).length,
    );
  });

  it('returns 0 when same horse locked in two positions', () => {
    expect(calculatePositionalCombinations([[1], [1], [2, 3]])).toBe(0);
  });
});
