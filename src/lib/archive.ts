import type { TrackSession } from '../types';
import { summarizeDay } from './outcomes';
import type { DaySummary } from './outcomes';

export const ARCHIVE_KEY = 'bet-slips-native:archive';
export const MAX_ARCHIVE_ENTRIES = 30;

export interface ArchiveEntry {
  id: string;
  date: string;           // ISO date string
  tracks: TrackSession[];
}

export interface ArchiveEntryWithSummary extends ArchiveEntry {
  summaries: { trackName: string; firstRace: number; lastRace: number; summary: DaySummary }[];
}

export function buildArchiveEntry(tracks: TrackSession[]): ArchiveEntry {
  return {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    tracks,
  };
}

export function buildSummaries(entry: ArchiveEntry): ArchiveEntryWithSummary['summaries'] {
  return entry.tracks
    .filter((t) => t.bettors.some((b) => b.history.length > 0))
    .map((t) => {
      const allRaces = t.bettors.flatMap((b) => b.history.map((e) => e.raceNumber ?? 1));
      const firstRace = allRaces.length > 0 ? Math.min(...allRaces) : 1;
      const lastRace = allRaces.length > 0 ? Math.max(...allRaces) : 1;
      return {
        trackName: t.name,
        firstRace,
        lastRace,
        summary: summarizeDay(t.bettors, t.results),
      };
    });
}

export function parseArchive(raw: string | null): ArchiveEntry[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ArchiveEntry[];
  } catch {
    return [];
  }
}

export function addToArchive(existing: ArchiveEntry[], tracks: TrackSession[]): ArchiveEntry[] {
  return [buildArchiveEntry(tracks), ...existing].slice(0, MAX_ARCHIVE_ENTRIES);
}
