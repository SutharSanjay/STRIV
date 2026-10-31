import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { useFrame } from '../../theme/useFrame';

type ScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  topInset?: boolean;
  safeBottom?: boolean;
};

export function Screen({ children, style, topInset = false, safeBottom = true }: ScreenProps) {
  const theme = useTheme();
  const frame = useFrame();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
          paddingHorizontal: frame.gutter,
          ...(topInset ? { paddingTop: insets.top + theme.spacing.sm } : null),
          ...(safeBottom
            ? { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) }
            : styles.aboveTabs),
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  aboveTabs: {
    paddingBottom: 0,
  },
});
