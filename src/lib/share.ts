import { Share } from 'react-native';
import type { BettorState, BetResult } from '../types';

const KEY_MODIFIERS = ['Key Horse', 'Wheel', 'Part Wheel'];

function formatHorses(bet: BetResult): string {
  if (bet.legs && bet.legs.length > 0) {
    return bet.legs.map((leg, i) => `R${i + 1}: ${leg.join(',')}`).join(' / ');
  }
  if (KEY_MODIFIERS.includes(bet.modifier) && bet.horses.length > 0) {
    const [key, ...rest] = bet.horses;
    return rest.length > 0 ? `${key} / ${rest.join(', ')}` : String(key);
  }
  return bet.horses.join(', ');
}

export function buildSlipText(
  trackName: string,
  raceNumber: number,
  bettors: BettorState[],
): string {
  const activeBettors = bettors.filter((b) =>
    b.history.some((e) => e.raceNumber === raceNumber),
  );

  const lines: string[] = [];
  lines.push(`🏇 ${trackName} — Race ${raceNumber}`);
  lines.push('');

  for (const bettor of activeBettors) {
    const bets = bettor.history.filter((e) => e.raceNumber === raceNumber);
    const subtotal = bets.reduce((s, e) => s + e.totalCost, 0);
    lines.push(`${bettor.name}  $${subtotal.toFixed(2)}`);
    for (const bet of bets) {
      const modifier = bet.modifier && bet.modifier !== 'Straight' ? ` (${bet.modifier})` : '';
      const horses = formatHorses(bet);
      const cost = `$${bet.unitCost.toFixed(2)} × ${bet.combinations} = $${bet.totalCost.toFixed(2)}`;
      lines.push(`  ${bet.betType}${modifier}  ${horses}  ${cost}`);
    }
    lines.push('');
  }

  const grandTotal = activeBettors.reduce(
    (sum, b) =>
      sum + b.history.filter((e) => e.raceNumber === raceNumber).reduce((s, e) => s + e.totalCost, 0),
    0,
  );
  lines.push(`Grand Total: $${grandTotal.toFixed(2)}`);

  return lines.join('\n');
}

export async function shareSlip(
  trackName: string,
  raceNumber: number,
  bettors: BettorState[],
): Promise<void> {
  const text = buildSlipText(trackName, raceNumber, bettors);
  await Share.share({ message: text });
}
