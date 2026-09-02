"use client";

import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import useTheme from '../hooks/useTheme';

interface ColumnInfo {
  name: string;
  type: string;
  constraints: string;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

interface TableStructureProps {
  content: string;
  theme?: any;
}

export function TableStructure({ content, theme: propTheme }: TableStructureProps): React.JSX.Element | null {
  // Use passed theme or fall back to useTheme hook
  let theme = propTheme;
  if (!theme) {
    const themeHook = useTheme();
    theme = themeHook.theme;
  }
  const tables = parseTables(content);

  if (tables.length === 0) {
    return null;
  }

  return (
    <FlatList
      testID="table-structure-list"
      data={tables}
      keyExtractor={(item) => item.name}
      renderItem={({ item: table }) => (
        <View style={styles.tableContainer}>
          <Text
            style={[
              styles.tableTitle,
              { color: theme.primary, fontWeight: '600' as const }
            ]}
          >
            Table: {table.name}
          </Text>
          
          <View style={[
            styles.tableWrapper,
            { borderColor: theme.border }
          ]}>
            <View style={[
              styles.headerRow,
              { backgroundColor: theme.surface, borderBottomColor: theme.border, borderBottomWidth: 1 }
            ]}>
              <Text style={[styles.headerCell, { fontWeight: '700' as const, color: theme.text }]}>
                Name
              </Text>
              <Text style={[styles.headerCell, { fontWeight: '700' as const, color: theme.text }]}>
                Type
              </Text>
              <Text style={[styles.headerCell, { fontWeight: '700' as const, color: theme.text }]}>
                Constraints
              </Text>
            </View>
            
            {table.columns.map((column, index) => (
              <View
                key={`${table.name}-${column.name}-${index}`}
                style={[
                  styles.dataRow,
                  index % 2 === 0 && styles.dataRowAlt,
                  { backgroundColor: theme.background }
                ]}
              >
                <Text style={[styles.dataCell, { color: theme.text }]}>
                  {column.name}
                </Text>
                <Text style={[styles.dataCell, { color: theme.text }]}>
                  {column.type}
                </Text>
                <Text style={[styles.dataCell, { color: theme.text }]}>
                  {column.constraints || '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    />
  );
}

export function parseTables(sql: string): TableInfo[] {
  const tables: TableInfo[] = [];
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_]\w*)\s*\(((?:\([^)]*\)|[^)])+?)\)\s*;/gi;
  
  let match;
  while ((match = createTableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const columnsStr = match[2];
    
    const columns = parseColumns(columnsStr);
    if (columns.length > 0) {
      tables.push({ name: tableName, columns });
    }
  }
  
  return tables;
}

export function parseColumns(columnsStr: string): ColumnInfo[] {
  const columns: ColumnInfo[] = [];
  
  const columnDefinitions = columnsStr
    .replace(/\n/g, ' ')
    .split(/,(?![^(]*\))/)
    .map(col => col.trim())
    .filter(col => {
      const upper = col.toUpperCase();
      return !upper.startsWith('FOREIGN KEY') && 
             !upper.startsWith('UNIQUE') &&
             !upper.startsWith('CHECK') &&
             !/^\s*PRIMARY\s+KEY/i.test(col) &&
             col.length > 0;
    });
  
  for (const colDef of columnDefinitions) {
    const parts = colDef.trim().split(/\s+/);
    if (parts.length < 2) continue;
    
    const name = parts[0].replace(/[`"\[\]]/g, '');
    let type = parts[1];
    let constraints: string[] = [];
    
    let i = 2;
    
    while (i < parts.length) {
      const part = parts[i];
      
      if (type.includes('(') && !type.includes(')')) {
        type += ' ' + part;
        i++;
      } else if (part.includes('(') && !part.includes(')') && i + 1 < parts.length && parts[i + 1].includes(')')) {
        type += ' ' + part + ' ' + parts[i + 1];
        i += 2;
        break;
      } else if (part.includes('(')) {
        type = part;
        i++;
        break;
      } else if (!part.match(/^(PRIMARY|NOT|NULL|UNIQUE|AUTO_INCREMENT|AUTOINCREMENT|DEFAULT|CHECK)$/i)) {
        type += ' ' + part;
        i++;
      } else {
        break;
      }
    }
    
    for (let j = i; j < parts.length; j++) {
      const part = parts[j].toUpperCase();
      
      if (part === 'PRIMARY' && j + 1 < parts.length && parts[j + 1].toUpperCase() === 'KEY') {
        constraints.push('PRIMARY KEY');
        j++;
      } else if (part === 'NOT' && j + 1 < parts.length && parts[j + 1].toUpperCase() === 'NULL') {
        constraints.push('NOT NULL');
        j++;
      } else if (part === 'UNIQUE') {
        constraints.push('UNIQUE');
      } else if (part === 'AUTO_INCREMENT' || part === 'AUTOINCREMENT') {
        constraints.push('AUTO_INCREMENT');
      } else if (part === 'DEFAULT' && j + 1 < parts.length) {
        let defaultValue = parts[j + 1];
        j++;
        
        while (j + 1 < parts.length && 
               !parts[j + 1].toUpperCase().match(/^(PRIMARY|NOT|UNIQUE|CHECK|REFERENCES)$/)) {
          defaultValue += ' ' + parts[j + 1];
          j++;
        }
        
        constraints.push(`DEFAULT ${defaultValue}`);
      } else if (part === 'CHECK' || (part.includes('(') && part.includes('CHECK'))) {
        constraints.push('CHECK');
      }
    }
    
    columns.push({
      name,
      type,
      constraints: constraints.join(', ')
    });
  }
  
  return columns;
}

const styles = StyleSheet.create({
  tableContainer: {
    marginBottom: 24,
  },
  tableTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  tableWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  dataRowAlt: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  dataCell: {
    flex: 1,
    fontSize: 13,
  },
});