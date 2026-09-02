module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-syntax-highlighter|@gluestack-ui|@gluestack-style|@expo|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context|@react-native-async-storage|react-native-fs|react-native-svg|@react-native-clipboard)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
