import RNFS from 'react-native-fs';
import { FileHandler } from '../FileHandler';

jest.mock('react-native-fs', () => ({
  stat: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock('react-native-fs');

describe('FileHandler', () => {
  it('should handle shared file correctly', async () => {
    const mockShared = { url: 'file:///test.sql' };
    const mockStats = {
      isFile: () => true,
      size: 1024,
    };
    const mockContent = 'SELECT * FROM users;';

    (RNFS.stat as jest.Mock).mockResolvedValue(mockStats);
    (RNFS.readFile as jest.Mock).mockResolvedValue(mockContent);

    const result = await FileHandler.handleSharedFile(mockShared);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('test.sql');
    expect(result?.content).toBe(mockContent);
    expect(result?.size).toBe(1024);
  });

  it('should return null for invalid shared data', async () => {
    const result = await FileHandler.handleSharedFile(null);
    expect(result).toBeNull();
  });

  it('should return null when shared data has no url', async () => {
    const result = await FileHandler.handleSharedFile({});
    expect(result).toBeNull();
  });

  it('should return null when file is not a file', async () => {
    const mockShared = { url: 'file:///test.sql' };
    const mockStats = {
      isFile: () => false,
      size: 0,
    };

    (RNFS.stat as jest.Mock).mockResolvedValue(mockStats);

    const result = await FileHandler.handleSharedFile(mockShared);

    expect(result).toBeNull();
  });

  it('should return null when RNFS.stat throws error', async () => {
    const mockShared = { url: 'file:///test.sql' };

    (RNFS.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

    const result = await FileHandler.handleSharedFile(mockShared);

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

  it('should throw error when readFileFromUri fails', async () => {
    const mockUri = 'file:///test.sql';

    (RNFS.readFile as jest.Mock).mockRejectedValue(new Error('Read failed'));

    await expect(FileHandler.readFileFromUri(mockUri)).rejects.toThrow('Read failed');
  });
})