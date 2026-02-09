import { storage, HistoryItem } from '../src/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockHistoryItem: HistoryItem = {
    id: '123',
    fileName: 'test.sql',
    filePath: '/path/to/test.sql',
    lastOpened: '2024-01-01T00:00:00.000Z',
    fileSize: 1024,
    preview: 'SELECT * FROM users',
  };

  describe('getHistory', () => {
    it('should return empty array when no history exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await storage.getHistory();
      
      expect(result).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@sql_viewer:history');
    });

    it('should parse and return history from AsyncStorage', async () => {
      const mockHistory = [mockHistoryItem];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));
      
      const result = await storage.getHistory();
      
      expect(result).toEqual(mockHistory);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      const result = await storage.getHistory();
      
      expect(result).toEqual([]);
    });
  });

  describe('saveHistory', () => {
    it('should save history to AsyncStorage', async () => {
      const mockHistory = [mockHistoryItem];
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      
      await storage.saveHistory(mockHistory);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@sql_viewer:history',
        JSON.stringify(mockHistory)
      );
    });

    it('should trim history to MAX_HISTORY_ITEMS', async () => {
      const largeHistory = Array(60).fill(mockHistoryItem);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      
      await storage.saveHistory(largeHistory);
      
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.length).toBe(50);
    });

    it('should throw error on save failure', async () => {
      const mockHistory = [mockHistoryItem];
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Save error'));
      
      await expect(storage.saveHistory(mockHistory)).rejects.toThrow('Save error');
    });
  });

  describe('addToHistory', () => {
    it('should add new item to history', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      
      const newItem = {
        fileName: 'new.sql',
        filePath: '/path/to/new.sql',
        fileSize: 2048,
        preview: 'INSERT INTO data',
      };
      
      await storage.addToHistory(newItem);
      
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].fileName).toBe('new.sql');
      expect(savedData[0].id).toBeDefined();
      expect(savedData[0].lastOpened).toBeDefined();
    });

    it('should remove duplicate items with same path', async () => {
      const existingHistory = [mockHistoryItem];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingHistory));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      
      const newItem = {
        fileName: 'updated.sql',
        filePath: '/path/to/test.sql', // Same path as mockHistoryItem
        fileSize: 2048,
        preview: 'UPDATE users',
      };
      
      await storage.addToHistory(newItem);
      
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].fileName).toBe('updated.sql');
    });

    it('should throw error on failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Add error'));
      
      await expect(storage.addToHistory(mockHistoryItem)).rejects.toThrow('Add error');
    });
  });

  describe('removeFromHistory', () => {
    it('should remove item from history', async () => {
      const existingHistory = [
        mockHistoryItem,
        { ...mockHistoryItem, id: '456', filePath: '/path/to/another.sql' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingHistory));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      
      await storage.removeFromHistory('/path/to/test.sql');
      
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].filePath).toBe('/path/to/another.sql');
    });

    it('should handle removing non-existent item', async () => {
      const existingHistory = [mockHistoryItem];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingHistory));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      
      await storage.removeFromHistory('/non/existent/path.sql');
      
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      
      await storage.clearHistory();
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@sql_viewer:history');
    });

    it('should throw error on failure', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Clear error'));
      
      await expect(storage.clearHistory()).rejects.toThrow('Clear error');
    });
  });
});