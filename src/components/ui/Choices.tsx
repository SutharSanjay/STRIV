import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

type Choice = {
  id: string | null;
  label: string;
};

type ChoicesProps = {
  label: string;
  options: readonly Choice[];
  value: string | null;
  onChange: (id: string | null) => void;
};

export function Choices({ label, options, value, onChange }: ChoicesProps) {
  const theme = useTheme();

  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text style={[theme.typography.footnote, { color: theme.colors.secondaryLabel }]}>
        {label}
      </Text>
      <View style={[styles.row, { marginTop: theme.spacing.xs }]}>
        {options.map(option => {
          const selected = option.id === value;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id)}
              style={[
                styles.choice,
                {
                  minHeight: theme.dimensions.minTouchTarget,
                  paddingHorizontal: theme.spacing.sm,
                  marginRight: theme.spacing.xs,
                  marginBottom: theme.spacing.xs,
                  borderRadius: theme.radius.sm,
                  backgroundColor: selected ? theme.colors.accent : theme.colors.backgroundSecondary,
                },
              ]}>
              <Text
                style={[
                  theme.typography.subhead,
                  { color: selected ? theme.colors.accentLabel : theme.colors.label },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  choice: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
