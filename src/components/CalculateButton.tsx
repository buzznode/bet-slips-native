import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, font } from '../theme';
import { haptic } from '../lib/haptics';

interface CalculateButtonProps {
  onClick: () => void;
  disabled: boolean;
  variant?: 'calculate' | 'reset';
  pendingCost?: number | null;
}

export default function CalculateButton({
  onClick,
  disabled,
  variant = 'calculate',
  pendingCost,
}: CalculateButtonProps) {
  let label = 'Add Bet →';
  if (variant === 'reset') {
    label = '↺ Reset';
  } else if (pendingCost != null) {
    const formatted =
      pendingCost % 1 === 0
        ? `$${pendingCost}`
        : `$${pendingCost.toFixed(2)}`;
    label = `Add ${formatted} Bet →`;
  }

  return (
    <Pressable
      style={[
        styles.btn,
        variant === 'reset' && styles.reset,
        disabled && styles.disabled,
      ]}
      onPress={() => { haptic.medium(); onClick(); }}
      disabled={disabled}
    >
      <Text style={[styles.text, variant === 'reset' && styles.textReset]}>
        {label}
      </Text>
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
  reset: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  textReset: {
    color: colors.textMuted,
  },
});
