import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, font } from '../theme';

export type HorseVariant = 'default' | 'selected' | 'key' | 'with' | 'scratched';

interface HorseButtonProps {
  number: number;
  variant?: HorseVariant;
  disabled?: boolean;
  size?: 'normal' | 'small';
  onClick: () => void;
}

export default function HorseButton({
  number,
  variant = 'default',
  disabled = false,
  size = 'normal',
  onClick,
}: HorseButtonProps) {
  const isDisabled = disabled || variant === 'scratched';

  return (
    <Pressable
      style={[
        styles.base,
        size === 'small' && styles.small,
        variant === 'selected' && styles.selected,
        variant === 'key' && styles.key,
        variant === 'with' && styles.with,
        variant === 'scratched' && styles.scratched,
        isDisabled && styles.disabled,
      ]}
      onPress={isDisabled ? undefined : onClick}
      disabled={isDisabled}
    >
      <Text
        style={[
          styles.text,
          size === 'small' && styles.textSmall,
          variant === 'selected' && styles.textSelected,
          variant === 'key' && styles.textKey,
          variant === 'with' && styles.textWith,
          variant === 'scratched' && styles.textScratched,
        ]}
      >
        {number}
      </Text>
    </Pressable>
  );
}

const SIZE = 42;
const SIZE_SM = 34;

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    width: SIZE_SM,
    height: SIZE_SM,
    borderRadius: radius.sm,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  key: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  with: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  scratched: {
    backgroundColor: colors.scratch,
    borderColor: colors.scratch,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: font.sm,
  },
  textSelected: {
    color: '#fff',
  },
  textKey: {
    color: '#000',
    fontWeight: '700',
  },
  textWith: {
    color: colors.primaryLight,
  },
  textScratched: {
    color: colors.scratchText,
    textDecorationLine: 'line-through',
  },
});
