import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';
import { FileHandler } from '../FileHandler';

jest.mock('react-native-fs', () => ({
  readFile: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    IntentModule: { readContentUri: jest.fn() },
  },
}));

describe('FileHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle shared file correctly', async () => {
    const mockShared = { url: 'file:///test.sql' };
    const mockContent = 'SELECT * FROM users;';

    (RNFS.readFile as jest.Mock).mockResolvedValue(mockContent);

    const result = await FileHandler.handleSharedFile(mockShared);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('test.sql');
    expect(result?.content).toBe(mockContent);
    expect(result?.size).toBe(mockContent.length);
  });

  it('should return null for invalid shared data', async () => {
    const result = await FileHandler.handleSharedFile(null);
    expect(result).toBeNull();
  });

  it('should return null when shared data has no url', async () => {
    const result = await FileHandler.handleSharedFile({});
    expect(result).toBeNull();
  });

  it('should read file from uri correctly', async () => {
    const mockUri = 'file:///test.sql';
    const mockContent = 'SELECT * FROM users;';

    (RNFS.readFile as jest.Mock).mockResolvedValue(mockContent);

    const result = await FileHandler.readFileFromUri(mockUri);

    expect(result).toBe(mockContent);
    expect(RNFS.readFile).toHaveBeenCalledWith(mockUri, 'utf8');
  });

  it('should read content:// uri via native module on Android', async () => {
    const mockUri = 'content://provider/test.sql';
    const mockContent = 'SELECT 1;';

    (NativeModules.IntentModule.readContentUri as jest.Mock).mockResolvedValue(
      mockContent,
    );

    const result = await FileHandler.readFileFromUri(mockUri);

    expect(result).toBe(mockContent);
    expect(NativeModules.IntentModule.readContentUri).toHaveBeenCalledWith(
      mockUri,
    );
    expect(RNFS.readFile).not.toHaveBeenCalled();
  });

  it('should throw error when readFileFromUri fails', async () => {
    const mockUri = 'file:///test.sql';

    (RNFS.readFile as jest.Mock).mockRejectedValue(new Error('Read failed'));

    await expect(FileHandler.readFileFromUri(mockUri)).rejects.toThrow(
      'Read failed',
    );
  });
});
