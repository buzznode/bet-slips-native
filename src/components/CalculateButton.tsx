import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, font } from '../theme';
import { haptic } from '../lib/haptics';

interface CalculateButtonProps {
  onClick: () => void;
  disabled: boolean;
  pendingCost?: number | null;
}

export default function CalculateButton({
  onClick,
  disabled,
  pendingCost,
}: CalculateButtonProps) {
  const costStr = pendingCost != null
    ? ` ${pendingCost % 1 === 0 ? `$${pendingCost}` : `$${pendingCost.toFixed(2)}`}`
    : '';
  const label = `Add${costStr} Bet →`;

  return (
    <Pressable
      style={[styles.btn, disabled && styles.disabled]}
      onPress={() => { haptic.medium(); onClick(); }}
      disabled={disabled}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    color: '#fff',
    fontSize: font.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
