import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { useFrame } from '../../theme/useFrame';

type ScreenHeaderProps = {
  title: string;
  detail?: string;
  eyebrow?: string;
  action?: ReactNode;
};

export function ScreenHeader({ title, detail, eyebrow, action }: ScreenHeaderProps) {
  const theme = useTheme();
  const frame = useFrame();

  return (
    <View style={styles.block}>
      {action ? <View style={styles.action}>{action}</View> : null}
      {eyebrow ? (
        <Text style={[theme.typography.footnote, styles.eyebrow, { color: theme.colors.accent }]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={[
          frame.compact ? styles.compactTitle : theme.typography.largeTitle,
          { color: theme.colors.label },
        ]}>
        {title}
      </Text>
      {detail ? (
        <Text
          style={[
            theme.typography.subhead,
            { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xxs },
          ]}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingBottom: 4,
  },
  action: {
    alignItems: 'flex-end',
  },
  eyebrow: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  compactTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
