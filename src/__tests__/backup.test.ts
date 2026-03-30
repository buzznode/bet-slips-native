import { buildBackupPayload, validateBackupPayload } from '../lib/backup';

const MOCK_STATE = {
  tracks: [{ id: '1', name: 'Santa Anita', bettors: [], activeBettorId: '', results: {}, scratchedHorses: [] }],
  activeTrackId: '1',
  templates: [],
};

describe('buildBackupPayload', () => {
  it('sets appKey to bet-slips-native', () => {
    const payload = buildBackupPayload(MOCK_STATE, '1.3.0');
    expect(payload.appKey).toBe('bet-slips-native');
  });

  it('includes the provided version', () => {
    const payload = buildBackupPayload(MOCK_STATE, '2.0.0');
    expect(payload.version).toBe('2.0.0');
  });

  it('includes exportedAt as an ISO string', () => {
    const payload = buildBackupPayload(MOCK_STATE, '1.3.0');
    expect(() => new Date(payload.exportedAt)).not.toThrow();
    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('embeds the state object', () => {
    const payload = buildBackupPayload(MOCK_STATE, '1.3.0');
    expect(payload.state).toEqual(MOCK_STATE);
  });
});

describe('validateBackupPayload', () => {
  it('returns true for a valid payload', () => {
    const payload = buildBackupPayload(MOCK_STATE, '1.3.0');
    expect(validateBackupPayload(payload)).toBe(true);
  });

  it('returns false for null', () => {
    expect(validateBackupPayload(null)).toBe(false);
  });

  it('returns false for a non-object', () => {
    expect(validateBackupPayload('not an object')).toBe(false);
    expect(validateBackupPayload(42)).toBe(false);
  });

  it('returns false when appKey is wrong', () => {
    const payload = { appKey: 'other-app', version: '1.0.0', exportedAt: new Date().toISOString(), state: MOCK_STATE };
    expect(validateBackupPayload(payload)).toBe(false);
  });

  it('returns false when version is missing', () => {
    const payload = { appKey: 'bet-slips-native', exportedAt: new Date().toISOString(), state: MOCK_STATE };
    expect(validateBackupPayload(payload)).toBe(false);
  });

  it('returns false when state is null', () => {
    const payload = { appKey: 'bet-slips-native', version: '1.3.0', exportedAt: new Date().toISOString(), state: null };
    expect(validateBackupPayload(payload)).toBe(false);
  });

  it('returns false when state is a primitive', () => {
    const payload = { appKey: 'bet-slips-native', version: '1.3.0', exportedAt: new Date().toISOString(), state: 'bad' };
    expect(validateBackupPayload(payload)).toBe(false);
  });

  it('survives a JSON round-trip', () => {
    const payload = buildBackupPayload(MOCK_STATE, '1.3.0');
    const roundTripped = JSON.parse(JSON.stringify(payload));
    expect(validateBackupPayload(roundTripped)).toBe(true);
  });
});
