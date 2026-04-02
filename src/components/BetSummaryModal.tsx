import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BettorState, BetResult } from '../types';
import { colors, spacing, radius, font } from '../theme';
import { shareSlip } from '../lib/share';

interface BetSummaryModalProps {
  trackName: string;
  raceNumber: number;
  bettors: BettorState[];
  onClose: () => void;
}

const KEY_MODIFIERS = ['Key Horse', 'Wheel', 'Part Wheel'];
const ORDINALS = ['1st', '2nd', '3rd', '4th'];
const POSITIONAL_BET_TYPES = new Set(['Trifecta', 'Superfecta']);

function formatHorses(result: BetResult): string {
  if (result.legs && result.legs.length > 0) {
    const isPositional = POSITIONAL_BET_TYPES.has(result.betType) && result.modifier === 'Part Wheel';
    return result.legs
      .map((leg, i) => `${isPositional ? ORDINALS[i] : `R${i + 1}`}: ${leg.join(',')}`)
      .join(' / ');
  }
  if (KEY_MODIFIERS.includes(result.modifier) && result.horses.length > 0) {
    const [key, ...rest] = result.horses;
    if (result.keyPosition === 'bottom') {
      return rest.length > 0 ? `${rest.join(', ')} / ${key}` : String(key);
    }
    return rest.length > 0 ? `${key} / ${rest.join(', ')}` : String(key);
  }
  return result.horses.join(', ');
}

export default function BetSummaryModal({
  trackName,
  raceNumber,
  bettors,
  onClose,
}: BetSummaryModalProps) {
  const activeBettors = bettors.filter((b) =>
    b.history.some((e) => e.raceNumber === raceNumber),
  );

  const grandTotal = activeBettors.reduce(
    (sum, b) =>
      sum +
      b.history
        .filter((e) => e.raceNumber === raceNumber)
        .reduce((s, e) => s + e.totalCost, 0),
    0,
  );

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.trackName}>{trackName}</Text>
            <Text style={styles.raceName}>Race {raceNumber}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.shareBtn}
              onPress={() => shareSlip(trackName, raceNumber, bettors)}
            >
              <Text style={styles.shareBtnText}>⬆ Share</Text>
            </Pressable>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {activeBettors.map((bettor) => {
            const bets = bettor.history.filter(
              (e) => e.raceNumber === raceNumber,
            );
            const subtotal = bets.reduce((s, e) => s + e.totalCost, 0);

            return (
              <View key={bettor.id} style={styles.bettorBlock}>
                <View style={styles.bettorHeader}>
                  <Text style={styles.bettorName}>{bettor.name}</Text>
                  <Text style={styles.bettorSubtotal}>
                    ${subtotal.toFixed(2)}
                  </Text>
                </View>
                {bets.map((bet, i) => (
                  <View key={i} style={styles.bet}>
                    <Text style={styles.betType}>
                      {bet.betType}
                      {bet.modifier && bet.modifier !== 'Straight'
                        ? ` (${bet.modifier})`
                        : ''}
                    </Text>
                    <Text style={styles.betHorses}>{formatHorses(bet)}</Text>
                    <Text style={styles.betCost}>
                      ${bet.unitCost.toFixed(2)} × {bet.combinations} ={' '}
                      <Text style={styles.betCostBold}>
                        ${bet.totalCost.toFixed(2)}
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Grand Total</Text>
          <Text style={styles.grandTotal}>${grandTotal.toFixed(2)}</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trackName: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  raceName: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shareBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareBtnText: {
    color: colors.primaryLight,
    fontSize: font.sm,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  bettorBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bettorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceHigh,
  },
  bettorName: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '700',
  },
  bettorSubtotal: {
    color: colors.primary,
    fontSize: font.md,
    fontWeight: '700',
  },
  bet: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  betType: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '600',
  },
  betHorses: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  betCost: {
    color: colors.textDim,
    fontSize: font.sm,
  },
  betCostBold: {
    color: colors.text,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerLabel: {
    color: colors.textMuted,
    fontSize: font.md,
    fontWeight: '600',
  },
  grandTotal: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: '800',
  },
});
