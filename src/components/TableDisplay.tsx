import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SQLTable } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TableDisplayProps {
  table: SQLTable;
  isDarkMode: boolean;
}

function TableDisplay({ table, isDarkMode }: TableDisplayProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'structure' | 'data'>('structure');
  const theme = isDarkMode ? dark : light;
  const columnWidth = Math.max(100, (SCREEN_WIDTH - 32) / table.columns.length);
  const rowHeight = 44;
  const headerHeight = 50;
  const totalWidth = Math.max(SCREEN_WIDTH - 16, table.columns.length * columnWidth);
  const hasData = table.rows && table.rows.length > 0;

  const renderStructureView = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <ScrollView showsVerticalScrollIndicator={true}>
          <View style={[styles.table, { width: totalWidth }]}>

            {table.columns.map((col, rowIndex) => (
              <View
                key={`row-${rowIndex}`}
                style={[
                  styles.row,
                  {
                    width: totalWidth,
                    backgroundColor: rowIndex % 2 === 0 ? theme.rowEven : theme.rowOdd,
                    borderBottomColor: theme.border,
                  }
                ]}>
                <View
                  style={[
                    styles.cell,
                    {
                      height: rowHeight,
                      borderRightColor: theme.border,
                      flex: 1,
                    },
                  ]}>
                  <Text style={[styles.cellValue, { color: theme.text, fontWeight: '500' }]}>
                    {col.name}
                  </Text>
                  <Text style={[styles.cellValueSmall, { color: theme.subtext }]}>
                    Type: {col.type}
                  </Text>
                  <Text style={[styles.cellValueSmall, { color: col.nullable ? theme.primary : theme.error }]}>
                    {col.nullable ? 'Nullable' : 'Required'}
                    {col.primaryKey && ' • Primary Key'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    );
  };

  const renderDataView = () => {
    if (!hasData) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: theme.subtext }]}>
            No data found. The SQL file may only contain CREATE TABLE statements.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.dataInfo, { backgroundColor: theme.rowOdd, borderBottomColor: theme.border }]}>
          <Text style={[styles.dataInfoText, { color: theme.text }]}>
            {table.rows!.length} row{table.rows!.length !== 1 ? 's' : ''}
          </Text>
          {table.rows && table.rows.length > 50 && (
            <Text style={[styles.dataInfoText, { color: theme.subtext, fontSize: 12 }]}>
              Showing first 50 rows
            </Text>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <ScrollView showsVerticalScrollIndicator={true}>
            <View style={[styles.table, { width: totalWidth }]}>
              <View style={[styles.headerRow, { width: totalWidth, backgroundColor: theme.headerBackground }]}>
                {table.columns.map((col, index) => (
                  <View
                    key={`data-header-${index}`}
                    style={[
                      styles.cell,
                      styles.headerCell,
                      {
                        width: columnWidth,
                        height: headerHeight,
                        borderRightColor: theme.border,
                      },
                    ]}>
                    <View style={styles.columnHeader}>
                      {col.primaryKey && (
                        <Text style={[styles.pkIcon, { color: theme.primary }]}>🔑</Text>
                      )}
                      <Text style={[styles.headerText, { color: theme.headerText }]}>
                        {col.name}
                      </Text>
                    </View>
                    <Text style={[styles.dataTypeText, { color: theme.subtext }]}>
                      {col.type}
                    </Text>
                  </View>
                ))}
              </View>

              {(table.rows || []).slice(0, 50).map((row, rowIndex) => (
                <View
                  key={`data-row-${rowIndex}`}
                  style={[
                    styles.row,
                    {
                      width: totalWidth,
                      backgroundColor: rowIndex % 2 === 0 ? theme.rowEven : theme.rowOdd,
                      borderBottomColor: theme.border,
                      minHeight: rowHeight,
                    }
                  ]}>
                  {row.map((value, colIndex) => (
                    <View
                      key={`cell-${rowIndex}-${colIndex}`}
                      style={[
                        styles.cell,
                        {
                          width: columnWidth,
                          height: rowHeight,
                          borderRightColor: theme.border,
                        },
                      ]}>
                      <Text 
                        style={[
                          styles.cellValue,
                          { 
                            color: value === 'NULL' ? theme.subtext : theme.text,
                            fontStyle: value === 'NULL' ? 'italic' : 'normal'
                          }
                        ]}
                        numberOfLines={1}>
                        {value === 'NULL' ? 'NULL' : value}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.tableName, { color: theme.text }]}>
          {table.name}
        </Text>
        <Text style={[styles.columnCount, { color: theme.subtext }]}>
          {table.columns.length} columns
          {hasData && ` • ${table.rows!.length} rows`}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'structure' && styles.activeTab,
            { borderBottomColor: activeTab === 'structure' ? theme.primary : 'transparent' }
          ]}
          onPress={() => setActiveTab('structure')}>
          <Text style={[
            styles.tabText,
            { color: activeTab === 'structure' ? theme.primary : theme.subtext }
          ]}>
            表结构
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'data' && styles.activeTab,
            { borderBottomColor: activeTab === 'data' ? theme.primary : 'transparent' }
          ]}
          onPress={() => setActiveTab('data')}>
          <Text style={[
            styles.tabText,
            { color: activeTab === 'data' ? theme.primary : theme.subtext }
          ]}>
            数据预览
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === 'structure' ? renderStructureView() : renderDataView()}
      </View>
    </View>
  );
}

const light = {
  background: '#FFFFFF',
  text: '#333333',
  subtext: '#666666',
  headerBackground: '#F8F8F8',
  headerText: '#000000',
  border: '#E0E0E0',
  primary: '#007AFF',
  rowEven: '#FFFFFF',
  rowOdd: '#F9F9F9',
  error: '#FF3B30',
};

const dark = {
  background: '#1C1C1E',
  text: '#FFFFFF',
  subtext: '#A0A0A0',
  headerBackground: '#2C2C2E',
  headerText: '#FFFFFF',
  border: '#3C3C3E',
  primary: '#0A84FF',
  rowEven: '#1C1C1E',
  rowOdd: '#252527',
  error: '#FF453A',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  tableName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  columnCount: {
    fontSize: 12,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  dataInfo: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
  },
  table: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#DDDDDD',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cell: {
    justifyContent: 'center',
    padding: 8,
    borderRightWidth: 1,
  },
  headerCell: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pkIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dataTypeText: {
    fontSize: 11,
    marginTop: 2,
  },
  nullableText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  cellValue: {
    fontSize: 13,
  },
  cellValueSmall: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default TableDisplay;
