import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, font } from '../theme';

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
        <Pressable onPress={onDismiss} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    backgroundColor: colors.dangerDim,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  text: {
    color: colors.text,
    fontSize: font.sm,
    flex: 1,
    lineHeight: 18,
  },
  close: {
    padding: spacing.xs,
  },
  closeText: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
});
