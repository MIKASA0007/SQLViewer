import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { FileHistoryItem } from '../types';

const STORAGE_KEY = '@sqlviewer_history';
const MAX_HISTORY_ITEMS = 20;

export class FileHistoryService {
  static async getHistory(): Promise<FileHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const history: FileHistoryItem[] = JSON.parse(data);
      return history.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  static async saveFileToHistory(item: FileHistoryItem): Promise<void> {
    try {
      const history = await this.getHistory();
      
      const existingIndex = history.findIndex(h => h.uri === item.uri);
      
      if (existingIndex >= 0) {
        history[existingIndex] = { ...history[existingIndex], ...item, lastOpenedAt: Date.now() };
      } else {
        history.unshift(item);
      }

      const filteredHistory = history.slice(0, MAX_HISTORY_ITEMS);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  static async deleteFromHistory(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filtered = history.filter(h => h.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting from history:', error);
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  static async searchHistory(query: string): Promise<FileHistoryItem[]> {
    try {
      const history = await this.getHistory();
      const lowerQuery = query.toLowerCase();
      return history.filter(
        h => 
          h.name.toLowerCase().includes(lowerQuery) ||
          h.sourceApp?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching history:', error);
      return [];
    }
  }

  static async copyFileToApp(uri: string, fileName: string): Promise<string> {
    try {
      const appDir = RNFS.DocumentDirectoryPath;
      const newFileName = `${Date.now()}_${fileName}`;
      const destinationPath = `${appDir}/${newFileName}`;
      
      await RNFS.copyFile(uri, destinationPath);
      return destinationPath;
    } catch (error) {
      console.error('Error copying file to app:', error);
      throw error;
    }
  }

  static async deleteCopiedFile(copiedPath: string): Promise<void> {
    try {
      if (await RNFS.exists(copiedPath)) {
        await RNFS.unlink(copiedPath);
      }
    } catch (error) {
      console.error('Error deleting copied file:', error);
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  static formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}
