import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FileHistoryItem } from '../types';
import { FileHistoryService } from '../services/FileHistoryService';

interface FileHistoryItemProps {
  item: FileHistoryItem;
  onPress: (item: FileHistoryItem) => void;
  onDelete: (id: string) => void;
  onCopy?: (item: FileHistoryItem) => void;
  isDeleting?: boolean;
}

const FileHistoryItemComponent: React.FC<FileHistoryItemProps> = ({
  item,
  onPress,
  onDelete,
  onCopy,
  isDeleting = false,
}) => {
  const fileSize = FileHistoryService.formatFileSize(item.size);
  const timeString = FileHistoryService.formatTime(item.lastOpenedAt);

  const handleDelete = () => {
    Alert.alert(
      '删除文件',
      `确定要从历史记录中删除 "${item.name}" 吗?`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => onDelete(item.id)
        },
      ]
    );
  };

  const handleCopy = () => {
    Alert.alert(
      '复制到应用',
      '将文件复制到应用私有存储，即使原文件被删除也能查看。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '复制', 
          onPress: () => onCopy?.(item)
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(item)}
      activeOpacity={0.6}
    >
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isCopied && (
            <Text style={styles.copiedBadge}>已复制</Text>
          )}
        </View>
        <View style={styles.actions}>
          {!item.isCopied && onCopy && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCopy}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionIcon}>📥</Text>
            </TouchableOpacity>
          )}
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FF3B30" />
          ) : (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.meta}>{fileSize}</Text>
        <Text style={styles.type}>{item.type.toUpperCase()}</Text>
        <Text style={styles.meta}>{timeString}</Text>
        {item.sourceApp && (
          <Text style={styles.source}>来自 {item.sourceApp}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333333',
    flex: 1,
  },
  copiedBadge: {
    fontSize: 10,
    backgroundColor: '#34C759',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    fontWeight: '600' as const,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  deleteIcon: {
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  meta: {
    fontSize: 12,
    color: '#999999',
  },
  type: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  source: {
    fontSize: 12,
    color: '#666666',
  },
});

export default FileHistoryItemComponent;
