import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { BetTemplate, ModifierId } from '../types';
import { colors, spacing, radius, font } from '../theme';

const MAX_TEMPLATES = 8;

interface BetTemplatesProps {
  templates: BetTemplate[];
  currentBetTypeId: string | null;
  currentModifier: ModifierId | null;
  currentBetUnit: number;
  mode: 'apply' | 'save';
  onApply: (template: BetTemplate) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
}

export default function BetTemplates({
  templates,
  currentBetTypeId,
  currentModifier,
  currentBetUnit,
  mode,
  onApply,
  onSave,
  onDelete,
}: BetTemplatesProps) {
  const canSave = currentBetTypeId !== null && templates.length < MAX_TEMPLATES;
  const isDuplicate =
    currentBetTypeId !== null &&
    templates.some(
      (t) =>
        t.betTypeId === currentBetTypeId &&
        t.modifier === currentModifier &&
        t.betUnit === currentBetUnit,
    );

  if (mode === 'apply') {
    if (templates.length === 0) return null;
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {templates.map((t) => (
            <View key={t.id} style={styles.chip}>
              <Pressable
                style={styles.chipLabel}
                onPress={() => onApply(t)}
              >
                <Text style={styles.chipText}>{t.name}</Text>
              </Pressable>
              <Pressable
                style={styles.chipRemove}
                onPress={() => onDelete(t.id)}
              >
                <Text style={styles.chipRemoveText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!canSave || isDuplicate) return null;
  return (
    <View style={styles.saveContainer}>
      <Pressable style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveBtnText}>+ Save Template</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  chipLabel: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipText: {
    color: colors.primaryLight,
    fontSize: font.sm,
    fontWeight: '600',
  },
  chipRemove: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderLeftWidth: 1,
    borderLeftColor: colors.primary,
  },
  chipRemoveText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  saveContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saveBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtnText: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
});
