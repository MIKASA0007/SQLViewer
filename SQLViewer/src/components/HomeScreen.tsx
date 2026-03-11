import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FileHistoryItem } from '../types';
import { FileHistoryService } from '../services/FileHistoryService';
import FileHistoryItemComponent from './FileHistoryItem';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [history, setHistory] = useState<FileHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<FileHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
    
    // 监听焦点变化，当返回到HomeScreen时刷新历史记录
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });
    
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (searchQuery.trim()) {
      filterHistory(searchQuery);
    } else {
      setFilteredHistory(history);
    }
  }, [searchQuery, history]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await FileHistoryService.getHistory();
      setHistory(data);
      setFilteredHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredHistory(history);
      return;
    }
    
    try {
      const filtered = await FileHistoryService.searchHistory(query);
      setFilteredHistory(filtered);
    } catch (error) {
      console.error('Error filtering history:', error);
    }
  }, [history]);

  const handleFilePress = useCallback(async (item: FileHistoryItem) => {
    try {
      console.log('DEBUG: Opening file from history:', item);
      
      // 尝试读取文件内容以便预加载
      let preloadedContent: string | undefined;
      try {
        const { FileHandler } = await import('../utils/FileHandler');
        preloadedContent = await FileHandler.readFileFromUri(item.uri);
        console.log('DEBUG: Successfully preloaded content for:', item.name);
      } catch (error) {
        console.warn('DEBUG: Could not preload content, will load in MainScreen:', error);
        // 如果无法预加载，仍然继续打开，只是没有预加载内容
      }
      
      console.log('DEBUG: Navigating to MainScreen with params:', {
        sharedUri: item.uri,
        fileName: item.name,
        hasPreloadedContent: !!preloadedContent,
        preloadedContentLength: preloadedContent?.length || 0
      });
      
      navigation.navigate('MainScreen', { 
        sharedUri: item.uri,
        fileName: item.name,
        preloadedContent,
      });
    } catch (error) {
      console.error('Error handling file press:', error);
      Alert.alert('错误', '打开文件失败，请重试');
    }
  }, [navigation]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
    
    try {
      const file = history.find(h => h.id === id);
      if (file?.copiedPath) {
        await FileHistoryService.deleteCopiedFile(file.copiedPath);
      }
      await FileHistoryService.deleteFromHistory(id);
      await loadHistory();
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('错误', '删除失败，请重试');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [history]);

  const handleCopy = useCallback(async (item: FileHistoryItem) => {
    setCopyingIds(prev => new Set(prev).add(item.id));
    
    try {
      const copiedPath = await FileHistoryService.copyFileToApp(
        item.uri,
        item.name
      );
      
      const updatedItem: FileHistoryItem = {
        ...item,
        isCopied: true,
        copiedPath,
        lastOpenedAt: Date.now(),
      };
      
      await FileHistoryService.saveFileToHistory(updatedItem);
      await loadHistory();
      Alert.alert('成功', '文件已复制到应用存储');
    } catch (error) {
      console.error('Error copying file:', error);
      Alert.alert('错误', '复制失败，请重试');
    } finally {
      setCopyingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, []);

  const handleClearHistory = () => {
    if (history.length === 0) return;
    
    Alert.alert(
      '清空历史',
      '确定要清空所有历史记录吗？已复制的文件也会被删除。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '清空', 
          style: 'destructive',
          onPress: async () => {
            try {
              for (const file of history) {
                if (file.copiedPath) {
                  await FileHistoryService.deleteCopiedFile(file.copiedPath);
                }
              }
              await FileHistoryService.clearHistory();
              await loadHistory();
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('错误', '清空失败，请重试');
            }
          }
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📄</Text>
      <Text style={styles.emptyTitle}>还没有文件</Text>
      <Text style={styles.emptyText}>
        从其他应用打开 SQL 文件，或使用分享功能将文件发送到这里
      </Text>
    </View>
  );

  const renderSearchEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>未找到文件</Text>
      <Text style={styles.emptyText}>
        尝试使用其他关键词搜索
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const showClearButton = history.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📄 SQLViewer</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 搜索文件..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {filteredHistory.length === 0 ? (
          searchQuery.trim() ? renderSearchEmptyState() : renderEmptyState()
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              最近文件 ({filteredHistory.length})
            </Text>
            {filteredHistory.map((item) => (
              <FileHistoryItemComponent
                key={item.id}
                item={item}
                onPress={handleFilePress}
                onDelete={handleDelete}
                onCopy={handleCopy}
                isDeleting={deletingIds.has(item.id)}
              />
            ))}
            {showClearButton && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearHistory}
              >
                <Text style={styles.clearButtonText}>清空历史</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333333',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666666',
    marginBottom: 12,
  },
  clearButton: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FF3B30',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default HomeScreen;
