/* eslint-disable no-undef */
// Jest global setup: mock native modules that are not available in test env.
jest.mock('react-native-fs', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  exists: jest.fn(),
  copyFile: jest.fn(),
  unlink: jest.fn(),
  DocumentDirectoryPath: '/mock/document/dir',
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async key => store[key] ?? null),
      setItem: jest.fn(async (key, value) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async key => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        Object.keys(store).forEach(k => delete store[k]);
      }),
    },
  };
});
