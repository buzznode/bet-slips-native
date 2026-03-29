import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { TrackSession } from '../types';
import { colors, spacing, radius, font } from '../theme';

function hasResults(track: TrackSession): boolean {
  return Object.values(track.results ?? {}).some((r) => r.first !== null);
}

interface TrackSelectorProps {
  tracks: TrackSession[];
  activeTrackId: string;
  trackTotal?: number;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export default function TrackSelector({
  tracks,
  activeTrackId,
  trackTotal,
  onSelect,
  onAdd,
  onRename,
  onRemove,
}: TrackSelectorProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewName('');
    setAdding(false);
  }

  function handleStartEdit(track: TrackSession) {
    setEditingId(track.id);
    setEditName(track.name);
  }

  function handleConfirmEdit() {
    const trimmed = editName.trim();
    if (editingId && trimmed) {
      onRename(editingId, trimmed);
    }
    setEditingId(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Track</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {tracks.map((track) => {
          const isActive = track.id === activeTrackId;
          return (
            <View key={track.id} style={[styles.tab, isActive && styles.tabActive]}>
              {editingId === track.id ? (
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  onBlur={handleConfirmEdit}
                  onSubmitEditing={handleConfirmEdit}
                  autoFocus
                  maxLength={30}
                  returnKeyType="done"
                  selectTextOnFocus
                />
              ) : (
                <View style={styles.tabInner}>
                  <Pressable onPress={() => onSelect(track.id)}>
                    <Text style={[styles.tabName, isActive && styles.tabNameActive]}>
                      {track.name}
                      {hasResults(track) ? ' ✓' : ''}
                    </Text>
                  </Pressable>
                  {isActive && (
                    <View style={styles.tabActions}>
                      <Pressable onPress={() => handleStartEdit(track)}>
                        <Text style={styles.actionText}>✏️</Text>
                      </Pressable>
                      {tracks.length > 1 && (
                        <Pressable onPress={() => onRemove(track.id)}>
                          <Text style={styles.actionText}>✕</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {adding ? (
          <View style={styles.newInputWrap}>
            <TextInput
              style={styles.newInput}
              placeholder="Track name…"
              placeholderTextColor={colors.textDim}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleAdd}
              autoFocus
              maxLength={30}
              returnKeyType="done"
            />
            <Pressable onPress={handleAdd}>
              <Text style={styles.confirmText}>✓</Text>
            </Pressable>
            <Pressable onPress={() => { setAdding(false); setNewName(''); }}>
              <Text style={styles.cancelText}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addBtn} onPress={() => setAdding(true)}>
            <Text style={styles.addBtnText}>+ Add Track</Text>
          </Pressable>
        )}
      </ScrollView>

      {(trackTotal ?? 0) > 0 && (
        <View style={styles.trackTotal}>
          <Text style={styles.trackTotalLabel}>Track Total</Text>
          <Text style={styles.trackTotalAmount}>
            ${(trackTotal ?? 0).toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  eyebrow: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  tabActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabName: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  tabNameActive: {
    color: colors.primaryLight,
  },
  tabActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: 12,
    color: colors.textDim,
  },
  editInput: {
    color: colors.text,
    fontSize: font.sm,
    minWidth: 80,
    paddingVertical: 0,
  },
  newInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  newInput: {
    color: colors.text,
    fontSize: font.sm,
    minWidth: 100,
    paddingVertical: 0,
  },
  confirmText: {
    color: colors.success,
    fontSize: font.md,
    fontWeight: '700',
  },
  cancelText: {
    color: colors.textDim,
    fontSize: font.md,
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addBtnText: {
    color: colors.textDim,
    fontSize: font.sm,
  },
  trackTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  trackTotalLabel: {
    color: colors.textDim,
    fontSize: font.sm,
  },
  trackTotalAmount: {
    color: colors.text,
    fontSize: font.sm,
    fontWeight: '700',
  },
});
