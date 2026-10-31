import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  placeholder?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  onSubmitEditing,
  keyboardType = 'default',
  placeholder,
}: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text style={[theme.typography.footnote, { color: theme.colors.secondaryLabel }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={onSubmitEditing ? 'done' : 'default'}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.tertiaryLabel}
        autoCorrect={false}
        style={[
          theme.typography.body,
          styles.input,
          {
            color: theme.colors.label,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.separator,
            borderRadius: theme.radius.md,
            marginTop: theme.spacing.xs,
            minHeight: theme.dimensions.minTouchTarget,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
  },
});
