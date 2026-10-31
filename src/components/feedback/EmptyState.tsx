import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { Icon, type IconName } from '../ui/Icon';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: IconName;
};

export function EmptyState({ title, message, icon = 'spark' }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { marginTop: theme.spacing.xl }]}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: theme.colors.accentSoft,
            borderRadius: theme.radius.xl,
          },
        ]}>
        <Icon name={icon} color={theme.colors.accent} size={28} />
      </View>
      <Text
        accessibilityRole="header"
        style={[theme.typography.title2, { color: theme.colors.label, marginTop: theme.spacing.md }]}>
        {title}
      </Text>
      <Text
        style={[
          theme.typography.body,
          styles.message,
          {
            color: theme.colors.secondaryLabel,
            marginTop: theme.spacing.sm,
          },
        ]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  badge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    maxWidth: 320,
  },
});
