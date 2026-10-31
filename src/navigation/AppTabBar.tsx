import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon, type IconName } from '../components/ui/Icon';
import { useTheme } from '../theme/ThemeProvider';

const ICONS: Record<string, IconName> = {
  Today: 'flame',
  Exercises: 'dumbbell',
  History: 'clock',
  Progress: 'chart',
};

const SLIDE = { damping: 22, stiffness: 240, mass: 0.7, overshootClamping: true };

export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const count = state.routes.length;
  const trackWidth = useSharedValue(0);
  const activeIndex = useSharedValue(state.index);
  const material = theme.scheme === 'dark' ? 'rgba(22, 27, 34, 0.94)' : 'rgba(255, 249, 244, 0.94)';

  useEffect(() => {
    activeIndex.value = withSpring(state.index, SLIDE);
  }, [activeIndex, state.index]);

  const sliderStyle = useAnimatedStyle(() => {
    const tab = count > 0 ? trackWidth.value / count : 0;
    return {
      width: tab,
      transform: [{ translateX: activeIndex.value * tab }],
    };
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[
          styles.capsule,
          theme.shadows.card,
          {
            backgroundColor: material,
            borderColor: theme.colors.separator,
          },
        ]}>
        <View
          style={styles.track}
          onLayout={event => {
            trackWidth.value = event.nativeEvent.layout.width;
          }}>
          <Animated.View
            pointerEvents="none"
            style={[styles.slider, { backgroundColor: theme.colors.accentSoft }, sliderStyle]}
          />
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const options = descriptors[route.key]?.options;
            const label = options?.title ?? route.name;
            const icon = ICONS[route.name] ?? 'spark';
            const color = focused ? theme.colors.accent : theme.colors.secondaryLabel;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: focused }}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                style={styles.item}>
                <View style={styles.pill}>
                  <Icon name={icon} color={color} size={22} />
                <Text numberOfLines={1} style={[theme.typography.caption, styles.label, focused ? styles.labelOn : null, { color }]}>
                  {label}
                </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  capsule: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 26,
  },
  item: {
    flex: 1,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    paddingVertical: 4,
  },
  label: {
    marginTop: 3,
  },
  labelOn: {
    fontWeight: '700',
  },
});
