const path = require('path');

module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: [
    '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js',
    '<rootDir>/jest.setup.js',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
  ],
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': path.join(
      __dirname,
      'node_modules/@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
    '^.+\\.sql$': '<rootDir>/jest.sql-transformer.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context|react-native-svg)/)',
  ],
};
