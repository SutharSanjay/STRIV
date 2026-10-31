import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

type MetricProps = {
  value: string;
  label: string;
  hint?: string;
};

export function Metric({ value, label, hint }: MetricProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.tile,
        theme.shadows.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.accentSoft,
          borderLeftColor: theme.colors.accent,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        },
      ]}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={[theme.typography.metric, { color: theme.colors.label }]}>
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={[theme.typography.footnote, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xxs }]}>
        {label}
      </Text>
      {hint ? (
        <Text
          numberOfLines={1}
          style={[theme.typography.caption, { color: theme.colors.tertiaryLabel, marginTop: theme.spacing.xxs }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 1,
    borderLeftWidth: 4,
  },
});
