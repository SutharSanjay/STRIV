import { useWindowDimensions } from 'react-native';

export function useFrame() {
  const { width, height, fontScale } = useWindowDimensions();
  const compact = width < 360;
  const tablet = width >= 768;
  const gutter = tablet ? Math.max(28, (width - 720) / 2) : compact ? 16 : 20;

  return { width, height, fontScale, compact, tablet, gutter };
}
