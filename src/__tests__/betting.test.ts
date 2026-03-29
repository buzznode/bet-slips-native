import {
  factorial,
  combinations,
  permutations,
  calculateCombinations,
  generateCombinationList,
  calculateLegCombinations,
  generateLegCombinationList,
  getMinHorses,
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

    it('key-horse: 4 horses = 3 combinations (P(3,1))', () => {
      expect(calculateCombinations('exacta', 'key-horse', [1, 2, 3, 4])).toBe(3);
    });
  });

  describe('trifecta (3 positions)', () => {
    it('box: 4 horses = 24 combinations (P(4,3))', () => {
      expect(calculateCombinations('trifecta', 'box', [1, 3, 5, 7])).toBe(24);
    });

    it('key-horse: 4 horses = key + P(3,2) = 6', () => {
      expect(calculateCombinations('trifecta', 'key-horse', [4, 5, 6, 7])).toBe(6);
    });

    it('part-wheel: 4 horses = C(4,2) = 6', () => {
      expect(calculateCombinations('trifecta', 'part-wheel', [4, 5, 6, 7])).toBe(6);
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
    it('key horse is always in position 1', () => {
      const list = generateCombinationList('trifecta', 'key-horse', [4, 5, 6, 7]);
      expect(list).toHaveLength(6);
      list.forEach((combo) => expect(combo[0]).toBe(4));
    });

    it('does not duplicate the key horse in subsequent positions', () => {
      const list = generateCombinationList('trifecta', 'key-horse', [4, 5, 6, 7]);
      list.forEach((combo) => {
        const withoutFirst = combo.slice(1);
        expect(withoutFirst).not.toContain(4);
      });
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
    expect(getMinHorses('trifecta', 'box')).toBe(3);
    expect(getMinHorses('exacta', 'wheel')).toBe(2);
    expect(getMinHorses('superfecta', 'box')).toBe(4);
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
