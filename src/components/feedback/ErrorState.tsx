import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../ui/Button';

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.xl },
      ]}>
      <Text accessibilityRole="header" style={[theme.typography.title2, { color: theme.colors.label }]}>
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
      {onRetry ? <Button label="Try again" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
