import * as Haptics from 'expo-haptics';

export const haptic = {
  selection: () => Haptics.selectionAsync(),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
};
