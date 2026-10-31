import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { PressableScale } from './PressableScale';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'accent';
};

export function Card({ children, onPress, accessibilityLabel, style, tone = 'surface' }: CardProps) {
  const theme = useTheme();
  const cardStyle = [
    styles.card,
    theme.shadows.card,
    {
      backgroundColor: tone === 'accent' ? theme.colors.accentSoft : theme.colors.surface,
      borderColor: tone === 'accent' ? theme.colors.accent : theme.colors.accentSoft,
      borderLeftColor: theme.colors.accent,
      borderRadius: theme.radius.lg,
      marginTop: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    style,
  ];

  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={cardStyle}>
        {children}
      </PressableScale>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderLeftWidth: 4,
  },
});
