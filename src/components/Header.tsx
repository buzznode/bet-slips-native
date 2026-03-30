import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, font } from '../theme';

const version = require('../../package.json').version;

interface HeaderProps {
  onReset: () => void;
  onSettings: () => void;
}

export default function Header({ onReset, onSettings }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.title}>🏇 Bet Slips</Text>
        <Text style={styles.version}>v{version}</Text>
      </View>
      <View style={styles.right}>
        <Pressable style={styles.settingsBtn} onPress={onSettings}>
          <Text style={styles.settingsText}>⚙</Text>
        </Pressable>
        <Pressable style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetText}>✕ Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  version: {
    color: colors.textDim,
    fontSize: font.sm,
  },
  settingsBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsText: {
    color: colors.textMuted,
    fontSize: font.md,
  },
  resetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.dangerDim,
  },
  resetText: {
    color: colors.danger,
    fontSize: font.sm,
    fontWeight: '600',
  },
});
