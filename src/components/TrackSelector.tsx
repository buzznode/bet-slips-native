import React, { useRef, useState } from 'react';
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
import { haptic } from '../lib/haptics';

function hasResults(track: TrackSession): boolean {
  return Object.values(track.results ?? {}).some((r) => r.first !== null);
}

interface TrackSelectorProps {
  tracks: TrackSession[];
  activeTrackId: string;
  onSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export default function TrackSelector({
  tracks,
  activeTrackId,
  onSelect,
  onLongPress,
  onAdd,
  onRename,
  onRemove,
}: TrackSelectorProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const containerWidth = useRef(0);
  const [showHint, setShowHint] = useState(false);

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
      <View style={styles.scrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          onLayout={(e) => { containerWidth.current = e.nativeEvent.layout.width; }}
          onContentSizeChange={(contentW) => { setShowHint(contentW > containerWidth.current); }}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            const atEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 4;
            setShowHint(!atEnd && contentSize.width > layoutMeasurement.width);
          }}
          scrollEventThrottle={16}
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
                    <Pressable
                      onPress={() => { haptic.selection(); onSelect(track.id); }}
                      onLongPress={() => { haptic.heavy(); onLongPress(track.id); }}
                    >
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
        {showHint && (
          <View style={styles.scrollHint} pointerEvents="none">
            <Text style={styles.scrollHintText}>›</Text>
          </View>
        )}
      </View>
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
  scrollWrap: {
    overflow: 'hidden',
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
  scrollHint: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  scrollHintText: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '300',
  },
});
