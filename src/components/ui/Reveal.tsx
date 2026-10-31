import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

type RevealProps = {
  children: ReactNode;
  index?: number;
};

export function Reveal({ children, index = 0 }: RevealProps) {
  const step = Math.min(index, 6);

  return (
    <Animated.View entering={FadeInDown.delay(step * 70).duration(520).springify().damping(18)}>
      {children}
    </Animated.View>
  );
}
