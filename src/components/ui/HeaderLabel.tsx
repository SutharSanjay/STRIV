import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

type HeaderLabelProps = {
  label: string;
  onPress: () => void;
};

export function HeaderLabel({ label, onPress }: HeaderLabelProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={[styles.hit, { minHeight: theme.dimensions.minTouchTarget }]}>
      <Text style={[theme.typography.headline, { color: theme.colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    justifyContent: 'center',
  },
});
