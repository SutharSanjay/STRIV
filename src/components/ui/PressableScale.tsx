import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({ children, style, disabled, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={event => {
        if (!disabled) {
          scale.value = withSpring(0.97, { damping: 16, stiffness: 360 });
        }
        onPressIn?.(event);
      }}
      onPressOut={event => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
        onPressOut?.(event);
      }}
      style={style}>
      <Animated.View style={animated}>{children}</Animated.View>
    </Pressable>
  );
}
