jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  keepLocalCopy: jest.fn(),
  saveDocuments: jest.fn(),
  types: { allFiles: '*/*' },
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: () => false,
}));

jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn(() => {
    throw new Error('op-sqlite is unavailable in unit tests');
  }),
}));

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

jest.mock('react-native-reanimated', () => {
  const { Pressable, Text, View } = require('react-native');

  const useSharedValue = init => ({ value: init });
  const useAnimatedStyle = style => style();
  const withSpring = toValue => toValue;
  const withTiming = toValue => toValue;
  const withRepeat = animation => animation;
  const Easing = { linear: value => value };

  const entering = {
    delay() {
      return this;
    },
    duration() {
      return this;
    },
    springify() {
      return this;
    },
    damping() {
      return this;
    },
  };

  return {
    __esModule: true,
    default: {
      View,
      Text,
      createAnimatedComponent: Component => Component ?? Pressable,
    },
    Easing,
    FadeInDown: entering,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});
