import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Polyline, Stop } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import type { ChartPoint } from '../../features/analytics/domain/series';
import { formatWeight } from '../../features/workouts/domain/format';
import { formatWhen } from '../../utils/time';

type WeightChartProps = {
  points: readonly ChartPoint[];
};

const HEIGHT = 180;

export function WeightChart({ points }: WeightChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const weights = points.map(point => point.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;
  const pad = 16;
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const plotted = points.map((point, index) => {
    const x = pad + index * step;
    const y = pad + (1 - (point.weight - min) / span) * (HEIGHT - pad * 2);
    return { x, y };
  });
  const coords = plotted.map(point => `${point.x},${point.y}`).join(' ');
  const last = plotted[plotted.length - 1];
  const summary = points
    .map(point => `${formatWhen(point.completedAt)} ${formatWeight(point.weight)} kg`)
    .join(', ');

  return (
    <View
      accessibilityLabel={summary}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.chart,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.separator,
          borderRadius: theme.radius.lg,
          marginTop: theme.spacing.md,
        },
      ]}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          <Defs>
            <LinearGradient id="lift" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={theme.colors.highlight} />
              <Stop offset="1" stopColor={theme.colors.accent} />
            </LinearGradient>
          </Defs>
          <Polyline
            points={coords}
            fill="none"
            stroke="url(#lift)"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {last ? <Circle cx={last.x} cy={last.y} r={5} fill={theme.colors.accent} /> : null}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    alignSelf: 'stretch',
    borderWidth: 1,
    overflow: 'hidden',
  },
});
