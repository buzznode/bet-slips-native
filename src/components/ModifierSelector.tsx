import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MODIFIERS } from '../types';
import type { ModifierId } from '../types';
import { colors, spacing, radius, font } from '../theme';

const STRAIGHT_ONLY_BET_TYPES = new Set(['win', 'place', 'show', 'across-the-board']);

interface ModifierSelectorProps {
  selected: ModifierId | null;
  disabled?: boolean;
  betTypeId?: string | null;
  onSelect: (id: ModifierId) => void;
}

export default function ModifierSelector({
  selected,
  disabled = false,
  betTypeId,
  onSelect,
}: ModifierSelectorProps) {
  const straightOnly = betTypeId != null && STRAIGHT_ONLY_BET_TYPES.has(betTypeId);
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.section}>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.title}>Modifiers</Text>
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
      </Pressable>

      {expanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {MODIFIERS.map((mod) => {
            const isActive = selected === mod.id;
            const isDisabled = disabled || (straightOnly && mod.id !== 'straight');
            return (
              <Pressable
                key={mod.id}
                style={[
                  styles.btn,
                  isActive && styles.btnActive,
                  isDisabled && styles.btnDisabled,
                ]}
                onPress={() => !isDisabled && onSelect(mod.id)}
                disabled={isDisabled}
              >
                <Text
                  style={[styles.btnText, isActive && styles.btnTextActive]}
                >
                  {mod.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: font.md,
    fontWeight: '700',
  },
  chevron: {
    color: colors.textDim,
    fontSize: 20,
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  btnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  btnTextActive: {
    color: '#fff',
  },
});
