import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../ui/Icon';

type LoadingStateProps = {
  message: string;
};

export function LoadingState({ message }: LoadingStateProps) {
  const theme = useTheme();
  const turn = useSharedValue(0);
  const spin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));

  useEffect(() => {
    turn.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1);
  }, [turn]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={[
          styles.badge,
          spin,
          {
            backgroundColor: theme.colors.accentSoft,
            borderRadius: theme.radius.xl,
          },
        ]}>
        <Icon name="spark" color={theme.colors.accent} size={26} />
      </Animated.View>
      <Text
        style={[
          theme.typography.callout,
          styles.message,
          { color: theme.colors.secondaryLabel, marginTop: theme.spacing.md },
        ]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
