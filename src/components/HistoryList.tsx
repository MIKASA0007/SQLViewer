import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { HistoryItem } from '../utils/storage';
import { useHistory } from '../hooks/useHistory';
import { lightTheme, Theme } from '../styles/theme';

interface HistoryListProps {
  theme?: Theme;
  onItemPress?: (item: HistoryItem) => void;
  maxItems?: number;
}

const HistoryList: React.FC<HistoryListProps> = ({
  theme = lightTheme,
  onItemPress,
  maxItems,
}) => {
  const { history, loading, error, removeFromHistory, refreshHistory } = useHistory();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleItemPress = (item: HistoryItem) => {
    onItemPress?.(item);
  };

  const handleItemLongPress = (item: HistoryItem) => {
    Alert.alert(
      'Remove from History',
      `Remove "${item.fileName}" from history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFromHistory(item.filePath);
          },
        },
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const preview = item.preview?.substring(0, 100) || '';
    const fileSize = formatFileSize(item.fileSize);

    return (
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleItemLongPress(item)}
        delayLongPress={500}
      >
        <View style={styles.itemHeader}>
          <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
            {item.fileName}
          </Text>
          <Text style={[styles.date, { color: theme.textSecondary, fontSize: theme.fontSizeSmall }] }>
            {formatDate(item.lastOpened)}
          </Text>
        </View>
        
        {preview ? (
          <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={2}>
            {preview}
          </Text>
        ) : null}
        
        <View style={styles.itemFooter}>
          {fileSize ? (
            <Text style={[styles.fileSize, { color: theme.textTertiary, fontSize: theme.fontSizeSmall }]}>
              {fileSize}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.emptyText, { color: theme.textSecondary, marginTop: 16 }]}>
            Loading history...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.danger }]}>
            {error}
          </Text>
          <TouchableOpacity 
            onPress={refreshHistory}
            style={[styles.retryButton, { backgroundColor: theme.accentSecondary }]}
          >
            <Text style={[styles.retryButtonText, { color: theme.background }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
          No recent files
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          Open SQL files to see them here
        </Text>
      </View>
    );
  };

  const displayHistory = maxItems ? history.slice(0, maxItems) : history;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={displayHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
  },
  date: {
    marginLeft: 8,
  },
  preview: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Monaco, Menlo, monospace',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  fileSize: {
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default HistoryList;