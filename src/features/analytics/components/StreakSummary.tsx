import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../../../theme/ThemeProvider';
import { useFrame } from '../../../theme/useFrame';

type StreakSummaryProps = {
  streak: number;
  message: string;
};

const RING = 96;
const STROKE = 8;

export function StreakSummary({ streak, message }: StreakSummaryProps) {
  const theme = useTheme();
  const frame = useFrame();
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (Math.min(streak, 12) / 12);

  return (
    <View
      accessibilityLabel={`${streak} session streak. ${message}`}
      style={[
        styles.card,
        theme.shadows.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.accent,
          borderRadius: theme.radius.lg,
          marginTop: theme.spacing.lg,
          padding: theme.spacing.md,
        },
      ]}>
      <View style={frame.compact ? styles.stack : styles.row}>
        <View style={styles.ring}>
          <Svg width={RING} height={RING}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={radius}
              stroke={theme.colors.accentSoft}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={radius}
              stroke={theme.colors.accent}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${filled} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <Text style={[theme.typography.metric, styles.value, { color: theme.colors.label }]}>{streak}</Text>
        </View>
        <View style={[styles.copy, frame.compact ? { marginTop: theme.spacing.sm } : { marginLeft: theme.spacing.md }]}>
          <Text style={[theme.typography.footnote, { color: theme.colors.accent }]}>Session streak</Text>
          <Text
            style={[
              theme.typography.body,
              styles.message,
              { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xs },
            ]}>
            {message}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stack: {
    alignItems: 'flex-start',
  },
  ring: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    position: 'absolute',
  },
  copy: {
    flex: 1,
  },
  message: {
    maxWidth: 220,
  },
});
