import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  fileName: string;
  filePath: string;
  lastOpened: string;
  fileSize?: number;
  preview?: string;
}

const HISTORY_KEY = '@sql_viewer:history';
const MAX_HISTORY_ITEMS = 50;

export const storage = {
  async getHistory(): Promise<HistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  },

  async saveHistory(history: HistoryItem[]): Promise<void> {
    try {
      const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving history:', error);
      throw error;
    }
  },

  async addToHistory(item: Omit<HistoryItem, 'id' | 'lastOpened'>): Promise<void> {
    try {
      const existingHistory = await this.getHistory();
      const now = new Date().toISOString();
      
      const newItem: HistoryItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        lastOpened: now,
      };

      const filteredHistory = existingHistory.filter(
        (h) => h.filePath !== item.filePath
      );
      
      const updatedHistory = [newItem, ...filteredHistory];
      await this.saveHistory(updatedHistory);
    } catch (error) {
      console.error('Error adding to history:', error);
      throw error;
    }
  },

  async removeFromHistory(filePath: string): Promise<void> {
    try {
      const existingHistory = await this.getHistory();
      const updatedHistory = existingHistory.filter((h) => h.filePath !== filePath);
      await this.saveHistory(updatedHistory);
    } catch (error) {
      console.error('Error removing from history:', error);
      throw error;
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  },
};

export default storage;