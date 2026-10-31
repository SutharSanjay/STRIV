import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'quiet';
  disabled?: boolean;
  icon?: IconName;
};

export function Button({ label, onPress, variant = 'primary', disabled = false, icon }: ButtonProps) {
  const theme = useTheme();
  const background =
    variant === 'secondary'
      ? theme.colors.surface
      : variant === 'quiet'
        ? 'transparent'
        : variant === 'danger'
          ? theme.colors.danger
          : theme.colors.accent;
  const color =
    variant === 'secondary' || variant === 'quiet' ? theme.colors.label : theme.colors.accentLabel;
  const borderColor = variant === 'secondary' ? theme.colors.separator : 'transparent';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'primary' || variant === 'danger' ? theme.shadows.card : theme.shadows.none,
        {
          minHeight: theme.dimensions.minTouchTarget,
          marginTop: theme.spacing.sm,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          backgroundColor: background,
          borderColor,
          ...(disabled ? styles.disabled : null),
        },
      ]}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} color={color} size={18} /> : null}
        <Text
          numberOfLines={1}
          style={[theme.typography.headline, icon ? styles.label : null, { color }]}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.45,
  },
});
