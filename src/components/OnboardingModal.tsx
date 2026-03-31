import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme';

interface OnboardingModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const SCREENS = [
  {
    emoji: '🏇',
    title: 'Welcome to Bet Slips',
    body: 'Your personal horse racing bet tracker. Calculate combinations, follow the action across multiple races and tracks, and see exactly where you stand at the end of the day.',
  },
  {
    emoji: '🏟️',
    title: 'Set Up Your Day',
    body: 'Tap "+ Add Track" to name the track you\'re at. Tap "+ Add" under Bettor to add yourself or anyone else who\'s betting. Rename them anything you like — "Brad", "Karen", "Me".',
  },
  {
    emoji: '🎰',
    title: 'Placing a Bet',
    body: 'Pick a bet type (Win, Exacta, Pick 3…), choose your modifier (Box, Wheel, Key Horse…), select your horses, then tap "Add Bet". The app calculates combinations and cost for you.',
  },
  {
    emoji: '👆',
    title: 'Long-Press for Quick Stats',
    body: 'Long-press any track or bettor name to see a snapshot of their bets, wins, losses, and spend. Handy for checking how everyone\'s doing without leaving the main screen.',
  },
  {
    emoji: '✅',
    title: 'Results & Payouts',
    body: 'After each race, scroll down to Race Results and enter the finishing order. Winning bets are highlighted automatically. Tap the payout field on any winner to record what you collected.',
  },
  {
    emoji: '🏁',
    title: 'End of Day',
    body: 'Tap "Final Summary" to see the full day breakdown. When you\'re done, hit Reset to clear the day and start fresh.',
  },
];

export default function OnboardingModal({ visible, onDismiss }: OnboardingModalProps) {
  const [index, setIndex] = useState(0);
  const isLast = index === SCREENS.length - 1;
  const screen = SCREENS[index];

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  function handleNext() {
    if (isLast) {
      onDismiss();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.card}>
            <Pressable style={styles.skipBtn} onPress={onDismiss}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>

            <View style={styles.body}>
              <Text style={styles.emoji}>{screen.emoji}</Text>
              <Text style={styles.title}>{screen.title}</Text>
              <Text style={styles.bodyText}>{screen.body}</Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.dots}>
                {SCREENS.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === index && styles.dotActive]}
                  />
                ))}
              </View>

              <Pressable style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>
                  {isLast ? 'Get Started' : 'Next'}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: Math.min(width - spacing.xl * 2, 400),
    padding: spacing.xl,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    color: colors.textDim,
    fontSize: font.sm,
  },
  body: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: font.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  nextBtnText: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '700',
  },
});
