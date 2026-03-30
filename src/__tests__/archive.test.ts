import { buildArchiveEntry, buildSummaries } from '../lib/archive';
import type { TrackSession } from '../types';

const makeTrack = (name: string, bets: number): TrackSession => ({
  id: '1',
  name,
  activeBettorId: 'b1',
  scratchedHorses: [],
  results: { 1: { first: 1, second: 2, third: 3, fourth: null } },
  bettors: [
    {
      id: 'b1',
      name: 'Brad',
      numHorses: 8,
      betUnit: 1,
      selectedBetType: null,
      selectedModifier: null,
      selectedHorses: [],
      selectedLegs: [],
      result: null,
      raceDay: { firstRace: 1, lastRace: 3, currentRace: 1, races: {} },
      history: Array.from({ length: bets }, (_, i) => ({
        betType: 'Win',
        modifier: 'Straight',
        combinations: 1,
        unitCost: 2,
        totalCost: 2,
        horses: [1],
        combinationList: [[1]],
        raceNumber: (i % 3) + 1,
      })),
    },
  ],
});

describe('buildArchiveEntry', () => {
  it('creates an entry with id, date, and tracks', () => {
    const tracks = [makeTrack('Santa Anita', 3)];
    const entry = buildArchiveEntry(tracks);
    expect(entry.id).toBeTruthy();
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(entry.tracks).toEqual(tracks);
  });

  it('generates a numeric string id', () => {
    const entry = buildArchiveEntry([]);
    expect(Number(entry.id)).toBeGreaterThan(0);
  });
});

describe('buildSummaries', () => {
  it('returns one summary per track with bets', () => {
    const entry = buildArchiveEntry([makeTrack('Santa Anita', 3), makeTrack('Del Mar', 0)]);
    const summaries = buildSummaries(entry);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].trackName).toBe('Santa Anita');
  });

  it('computes firstRace and lastRace from bet history', () => {
    const entry = buildArchiveEntry([makeTrack('Santa Anita', 3)]);
    const summaries = buildSummaries(entry);
    expect(summaries[0].firstRace).toBe(1);
    expect(summaries[0].lastRace).toBe(3);
  });

  it('returns empty array when no tracks have bets', () => {
    const entry = buildArchiveEntry([makeTrack('Empty Track', 0)]);
    expect(buildSummaries(entry)).toHaveLength(0);
  });

  it('includes a DaySummary for each track', () => {
    const entry = buildArchiveEntry([makeTrack('Santa Anita', 2)]);
    const summaries = buildSummaries(entry);
    expect(summaries[0].summary).toBeDefined();
    expect(summaries[0].summary.bettors).toHaveLength(1);
  });
});
