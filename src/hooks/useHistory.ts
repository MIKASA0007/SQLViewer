import { useState, useEffect, useCallback } from 'react';
import { storage, HistoryItem } from './storage';

export interface UseHistoryReturn {
  history: HistoryItem[];
  loading: boolean;
  error: string | null;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'lastOpened'>) => Promise<void>;
  removeFromHistory: (filePath: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

export const useHistory = (): UseHistoryReturn => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const historyData = await storage.getHistory();
      setHistory(historyData);
    } catch (err) {
      setError('Failed to load history');
      console.error('Error refreshing history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToHistory = useCallback(async (item: Omit<HistoryItem, 'id' | 'lastOpened'>) => {
    try {
      setError(null);
      await storage.addToHistory(item);
      await refreshHistory();
    } catch (err) {
      setError('Failed to add to history');
      console.error('Error adding to history:', err);
      throw err;
    }
  }, [refreshHistory]);

  const removeFromHistory = useCallback(async (filePath: string) => {
    try {
      setError(null);
      await storage.removeFromHistory(filePath);
      await refreshHistory();
    } catch (err) {
      setError('Failed to remove from history');
      console.error('Error removing from history:', err);
      throw err;
    }
  }, [refreshHistory]);

  const clearHistory = useCallback(async () => {
    try {
      setError(null);
      await storage.clearHistory();
      setHistory([]);
    } catch (err) {
      setError('Failed to clear history');
      console.error('Error clearing history:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  return {
    history,
    loading,
    error,
    addToHistory,
    removeFromHistory,
    clearHistory,
    refreshHistory,
  };
};

export default useHistory;