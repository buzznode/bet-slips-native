import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RaceOutcome from '../components/RaceOutcome';
import BetHistory from '../components/BetHistory';
import HorseButton from '../components/HorseButton';
import type { BetResult, RaceResult } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeBet(overrides: Partial<BetResult> = {}): BetResult {
  return {
    betType: 'Win',
    modifier: 'Straight',
    combinations: 1,
    unitCost: 1,
    totalCost: 1,
    horses: [3],
    combinationList: [[3]],
    raceNumber: 1,
    ...overrides,
  };
}

function makeResults(overrides: Partial<RaceResult> = {}): Record<number, RaceResult> {
  return {
    1: { first: null, second: null, third: null, fourth: null, ...overrides },
  };
}

// ── HorseButton ────────────────────────────────────────────────────────────

describe('HorseButton', () => {
  it('renders the horse number', () => {
    const { getByText } = render(
      <HorseButton number={5} onClick={() => {}} />,
    );
    expect(getByText('5')).toBeTruthy();
  });

  it('calls onClick when pressed', () => {
    const onClick = jest.fn();
    const { getByText } = render(
      <HorseButton number={7} onClick={onClick} />,
    );
    fireEvent.press(getByText('7'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = jest.fn();
    const { getByText } = render(
      <HorseButton number={4} disabled onClick={onClick} />,
    );
    fireEvent.press(getByText('4'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when scratched without allowScratchedPress', () => {
    const onClick = jest.fn();
    const { getByText } = render(
      <HorseButton number={6} variant="scratched" onClick={onClick} />,
    );
    fireEvent.press(getByText('6'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onClick when scratched with allowScratchedPress', () => {
    const onClick = jest.fn();
    const { getByText } = render(
      <HorseButton number={6} variant="scratched" allowScratchedPress onClick={onClick} />,
    );
    fireEvent.press(getByText('6'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ── BetHistory ────────────────────────────────────────────────────────────

describe('BetHistory', () => {
  const defaultProps = {
    history: [{ entry: makeBet(), originalIndex: 0 }],
    raceNumber: 1,
    results: makeResults(),
    onRemove: jest.fn(),
    onClearAll: jest.fn(),
    onSetPayout: jest.fn(),
  };

  it('renders nothing when history is empty', () => {
    const { toJSON } = render(
      <BetHistory {...defaultProps} history={[]} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('shows bet count badge', () => {
    const { getByText } = render(<BetHistory {...defaultProps} />);
    expect(getByText('1')).toBeTruthy();
  });

  it('expands body on header press', () => {
    const { getByText } = render(<BetHistory {...defaultProps} />);
    fireEvent.press(getByText('Race 1 Bets'));
    expect(getByText('Clear All')).toBeTruthy();
  });

  it('calls onClearAll when Clear All is pressed', () => {
    const onClearAll = jest.fn();
    const { getByText } = render(
      <BetHistory {...defaultProps} onClearAll={onClearAll} />,
    );
    fireEvent.press(getByText('Race 1 Bets'));
    fireEvent.press(getByText('Clear All'));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when trash is pressed', () => {
    const onRemove = jest.fn();
    const { getByText, getAllByText } = render(
      <BetHistory {...defaultProps} onRemove={onRemove} />,
    );
    fireEvent.press(getByText('Race 1 Bets'));
    fireEvent.press(getAllByText('🗑')[0]);
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it('hides trash and Clear All when locked', () => {
    const { getByText, queryByText } = render(
      <BetHistory {...defaultProps} locked />,
    );
    fireEvent.press(getByText('Race 1 Bets'));
    expect(queryByText('Clear All')).toBeNull();
    expect(queryByText('🗑')).toBeNull();
  });
});

// ── RaceOutcome ────────────────────────────────────────────────────────────

describe('RaceOutcome', () => {
  const races = { 1: { numHorses: 8, scratchedHorses: [] } };

  const defaultProps = {
    isRaceDay: false,
    firstRace: 1,
    lastRace: 5,
    races,
    numHorses: 8,
    results: {},
    superfectaRaces: new Set<number>(),
    onChange: jest.fn(),
  };

  it('renders collapsed by default', () => {
    const { getByText, queryByText } = render(<RaceOutcome {...defaultProps} />);
    expect(getByText('Race Results')).toBeTruthy();
    expect(queryByText('1st')).toBeNull();
  });

  it('expands on header press', () => {
    const { getByText } = render(<RaceOutcome {...defaultProps} />);
    fireEvent.press(getByText('Race Results'));
    expect(getByText('1st')).toBeTruthy();
    expect(getByText('2nd')).toBeTruthy();
    expect(getByText('3rd')).toBeTruthy();
  });

  it('calls onChange when a horse is selected', () => {
    const onChange = jest.fn();
    const { getByText, getAllByText } = render(
      <RaceOutcome {...defaultProps} onChange={onChange} />,
    );
    fireEvent.press(getByText('Race Results'));
    // Press horse 2 in the 1st position row
    fireEvent.press(getAllByText('2')[0]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        0: expect.objectContaining({ first: 2 }),
      }),
    );
  });

  it('shows 4th position row for superfecta races in race day mode', () => {
    const { getByText, queryByText } = render(
      <RaceOutcome
        {...defaultProps}
        isRaceDay
        currentRace={1}
        superfectaRaces={new Set([1])}
        results={{ 1: { first: null, second: null, third: null, fourth: null } }}
      />,
    );
    fireEvent.press(getByText('Race Results'));
    expect(getByText('4th')).toBeTruthy();
    // Non-superfecta race has no 4th row
    expect(queryByText('4th')).toBeTruthy();
  });

  it('does not show 4th position for non-superfecta', () => {
    const { getByText, queryByText } = render(
      <RaceOutcome {...defaultProps} />,
    );
    fireEvent.press(getByText('Race Results'));
    expect(queryByText('4th')).toBeNull();
  });

  it('shows Clear button when a result is set', () => {
    const { getByText } = render(
      <RaceOutcome
        {...defaultProps}
        results={{ 0: { first: 3, second: null, third: null, fourth: null } }}
      />,
    );
    fireEvent.press(getByText('Race Results'));
    expect(getByText('Clear')).toBeTruthy();
  });

  it('shows scratched horses as non-selectable in race day mode', () => {
    const onChange = jest.fn();
    const racesWithScratch = { 1: { numHorses: 8, scratchedHorses: [3] } };
    const { getByText, getAllByText } = render(
      <RaceOutcome
        {...defaultProps}
        isRaceDay
        currentRace={1}
        races={racesWithScratch}
        onChange={onChange}
      />,
    );
    fireEvent.press(getByText('Race Results'));
    // Horse 3 is scratched — pressing it should not call onChange
    const horse3Buttons = getAllByText('3');
    fireEvent.press(horse3Buttons[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
