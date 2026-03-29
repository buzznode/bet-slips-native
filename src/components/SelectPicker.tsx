import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme';

interface Option<T> {
  label: string;
  value: T;
}

interface SelectPickerProps<T> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export default function SelectPicker<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
          <Text style={styles.triggerText}>{selected?.label ?? '—'}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
          <ScrollView>
            {options.map((opt) => (
              <Pressable
                key={String(opt.value)}
                style={[
                  styles.option,
                  opt.value === value && styles.optionSelected,
                ]}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    opt.value === value && styles.optionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {opt.value === value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trigger: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 100,
  },
  triggerText: {
    color: colors.text,
    fontSize: font.md,
  },
  chevron: {
    color: colors.textDim,
    fontSize: font.lg,
    marginLeft: spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: font.lg,
    fontWeight: '600',
  },
  doneText: {
    color: colors.primary,
    fontSize: font.md,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primaryDim,
  },
  optionText: {
    color: colors.text,
    fontSize: font.md,
  },
  optionTextSelected: {
    color: colors.primaryLight,
    fontWeight: '600',
  },
  checkmark: {
    color: colors.primary,
    fontSize: font.md,
  },
});
