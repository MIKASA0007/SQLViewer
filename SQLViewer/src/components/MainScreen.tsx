import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { FileHandler, FileInfo } from '../utils/FileHandler';
import { SQLParser } from '../utils/SQLParser';
import { FileData, DisplayMode, SQLStatement, SQLTable, Column } from '../types';
import CodeDisplay from '../components/CodeDisplay';
import AIAssistant from '../components/AIAssistant';

function MainScreen(): React.JSX.Element {
  const route = useRoute<RouteProp<any, 'MainScreen'>>();
  const sharedUri = route.params?.sharedUri;
  
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'data'>('code');
  const [dataSubTab, setDataSubTab] = useState<'structure' | 'preview'>('structure');

  useEffect(() => {
    console.log('MainScreen useEffect, sharedUri:', sharedUri);
    if (sharedUri) {
      loadFile(sharedUri);
    }
  }, [sharedUri]);

  const loadFile = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const content = await FileHandler.readFileFromUri(uri);
      const fileName = uri.split('/').pop() || 'unknown.sql';
      
      const statements = SQLParser.parse(content);

      const newData: FileData = {
        uri,
        name: fileName,
        content,
        statements,
      };

      setFileData(newData);
    } catch (err) {
      setError('Failed to load file. Please try again.');
      console.error('Error loading file:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!fileData) return;
    
    try {
      const { Share } = require('react-native');
      await Share.share({
        title: 'Share SQL content',
        message: fileData.content,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share content');
      console.error('Error sharing content:', err);
    }
  }, [fileData]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading file...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!fileData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.welcomeText}>SQLViewer</Text>
        <Text style={styles.instructionText}>
          Open SQL files or share them with this app
        </Text>
        <Text style={styles.featureText}>
          ✨ View CREATE TABLE statements as tables
        </Text>
        <Text style={styles.featureText}>
          💻 View SQL code with syntax highlighting
        </Text>
      </View>
    );
  }

  const createTableStatements = fileData.statements.filter(
    (s): s is SQLStatement & { table: SQLTable } => s.type === 'CREATE_TABLE' && !!s.table
  );

  const insertStatements = fileData.statements.filter(s => s.type === 'INSERT');

  const renderTableStructure = () => {
    if (createTableStatements.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>没有创建表语句</Text>
        </View>
      );
    }

    return (
      <View style={styles.tableList}>
        {createTableStatements.map((stmt, stmtIndex) => (
          <View key={stmtIndex} style={styles.tableContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.tableWrapper}>
                <View style={[styles.tableHeader, { backgroundColor: '#F0F0F0' }]}>
                  <Text style={[styles.headerCell, styles.nameColumn]}>字段名</Text>
                  <Text style={[styles.headerCell, styles.typeColumn]}>类型</Text>
                  <Text style={[styles.headerCell, styles.constraintColumn]}>约束</Text>
                </View>
                
                {stmt.table.columns.map((column, colIndex) => (
                  <View 
                    key={colIndex} 
                    style={[
                      styles.tableRow,
                      { backgroundColor: colIndex % 2 === 0 ? '#FFFFFF' : '#F8F8F8' }
                    ]}
                  >
                    <Text style={[styles.tableCell, styles.nameColumn]} numberOfLines={1}>
                      {column.name}
                    </Text>
                    <Text style={[styles.tableCell, styles.typeColumn]} numberOfLines={1}>
                      {column.type}
                    </Text>
                    <Text style={[styles.tableCell, styles.constraintColumn]} numberOfLines={1}>
                      {column.primaryKey ? 'PK' : ''}{column.nullable ? '' : ' NOT NULL'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ))}
      </View>
    );
  };

  const renderDataPreview = () => {
    if (createTableStatements.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>没有创建表语句</Text>
        </View>
      );
    }

    const allInsertData: { tableName: string; columns: Column[]; rows: string[][] }[] = [];
    
    createTableStatements.forEach(stmt => {
      const tableName = stmt.table.name;
      const columns = stmt.table.columns;
      
      const insertData: string[][] = [];
      insertStatements.forEach(insert => {
        const match = insert.original.match(/INSERT\s+INTO\s+[`"']?(\w+)[`"']?/i);
        if (match && match[1].toLowerCase() === tableName.toLowerCase()) {
          const valuesMatch = insert.original.match(/VALUES\s*(.+)/is);
          if (valuesMatch) {
            const valuesStr = valuesMatch[1];
            const rowRegex = /\(([^)]+)\)/g;
            let rowMatch;
            while ((rowMatch = rowRegex.exec(valuesStr)) !== null) {
              const rowValues = rowMatch[1].split(',').map((v: string) => v.trim().replace(/^['"`]|['"`]$/g, ''));
              insertData.push(rowValues);
            }
          }
        }
      });
      
      allInsertData.push({ tableName, columns, rows: insertData });
    });

    const hasData = allInsertData.some(d => d.rows.length > 0);
    
    if (!hasData) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>暂无数据 (无 INSERT 语句)</Text>
        </View>
      );
    }

    const allRows: { row: string[]; bgColor: string }[] = [];
    allInsertData.forEach(data => {
      data.rows.forEach((row, idx) => {
        allRows.push({ row, bgColor: allRows.length % 2 === 0 ? '#FFFFFF' : '#F8F8F8' });
      });
    });

    return (
      <View style={styles.centeredTableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableWrapper}>
            <View style={[styles.tableHeader, { backgroundColor: '#F0F0F0' }]}>
              {allInsertData[0].columns.map((col, colIdx) => (
                <Text key={colIdx} style={[styles.headerCell, styles.previewColumn]}>
                  {col.name}
                </Text>
              ))}
            </View>
            
            {allRows.map((item, rowIdx) => (
              <View 
                key={rowIdx}
                style={[styles.tableRow, { backgroundColor: item.bgColor }]}
              >
                {item.row.map((value: string, valIdx: number) => (
                  <Text 
                    key={valIdx} 
                    style={[styles.tableCell, styles.previewColumn]}
                    numberOfLines={1}
                  >
                    {value}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'code' && styles.tabActive]}
          onPress={() => setActiveTab('code')}
        >
          <Text style={[styles.tabText, activeTab === 'code' && styles.tabTextActive]}>
            代码
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'data' && styles.tabActive]}
          onPress={() => setActiveTab('data')}
        >
          <Text style={[styles.tabText, activeTab === 'data' && styles.tabTextActive]}>
            数据
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'code' ? (
        <CodeDisplay
          content={fileData.content}
          isDarkMode={false}
          onShare={handleShare}
        />
      ) : (
        <View style={styles.dataTabContainer}>
          <View style={styles.subTabBar}>
            <TouchableOpacity
              style={[styles.subTab, dataSubTab === 'structure' && styles.subTabActive]}
              onPress={() => setDataSubTab('structure')}
            >
              <Text style={[styles.subTabText, dataSubTab === 'structure' && styles.subTabTextActive]}>
                表结构
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTab, dataSubTab === 'preview' && styles.subTabActive]}
              onPress={() => setDataSubTab('preview')}
            >
              <Text style={[styles.subTabText, dataSubTab === 'preview' && styles.subTabTextActive]}>
                数据预览
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.dataContent}>
            {dataSubTab === 'structure' ? renderTableStructure() : renderDataPreview()}
          </ScrollView>
        </View>
      )}
      <AIAssistant sqlContent={fileData?.content || ''} serverUrl="http://192.168.1.134:3001" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  subTabText: {
    fontSize: 14,
    color: '#666666',
  },
  subTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dataTabContainer: {
    flex: 1,
  },
  dataContent: {
    flex: 1,
  },
  tableList: {
    padding: 16,
    alignItems: 'center',
  },
  tableContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerCell: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
  },
  nameColumn: {
    flex: 2,
    minWidth: 100,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    textAlign: 'center',
  },
  typeColumn: {
    flex: 2,
    minWidth: 100,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    textAlign: 'center',
  },
  constraintColumn: {
    flex: 1,
    minWidth: 80,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  previewColumn: {
    flex: 1,
    minWidth: 80,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
  centeredTableContainer: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MainScreen;