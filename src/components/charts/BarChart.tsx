import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';

export type BarPoint = {
  label: string;
  value: number;
};

type BarChartProps = {
  bars: readonly BarPoint[];
  unit: string;
};

const HEIGHT = 132;
const LABEL = 18;

export function BarChart({ bars, unit }: BarChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const max = Math.max(...bars.map(bar => bar.value), 0);
  const gap = 8;
  const barWidth = bars.length > 0 && width > 0 ? (width - gap * (bars.length - 1)) / bars.length : 0;
  const summary = bars.map(bar => `${bar.label} ${bar.value} ${unit}`).join(', ');

  return (
    <View
      accessibilityLabel={summary}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={styles.chart}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {bars.map((bar, index) => {
            const height = max <= 0 ? 0 : (bar.value / max) * (HEIGHT - 8);
            const x = index * (barWidth + gap);
            const y = HEIGHT - height;
            const current = index === bars.length - 1;
            return (
              <Rect
                key={bar.label}
                x={x}
                y={y}
                width={Math.max(barWidth, 0)}
                height={height}
                rx={6}
                fill={current ? theme.colors.accent : theme.colors.highlight}
              />
            );
          })}
        </Svg>
      ) : null}
      <View style={styles.labels}>
        {bars.map(bar => (
          <Text
            key={bar.label}
            numberOfLines={1}
            style={[theme.typography.caption, styles.label, { color: theme.colors.tertiaryLabel }]}>
            {bar.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    marginTop: 12,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: LABEL,
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});
