import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { Theme } from '../styles/theme';
import useTheme from '../hooks/useTheme';

interface DataPreviewProps {
  sql: string;
  theme?: Theme;
  headerComponent?: React.ReactNode;
}

interface ParsedData {
  tableName: string;
  columns: string[];
  rows: Array<(string | number | null)>[];
  totalRows: number;
}

export function parseInsertStatement(sql: string): ParsedData | null {
  if (!sql || !sql.trim()) return null;

  const insertRegex = /INSERT\s+INTO\s+([\w.\[\]`"]+)\s*(?:\(([^)]+)\))?\s*VALUES\s*(.+)/i;
  const match = sql.match(insertRegex);

  if (!match) return null;

  const tableName = match[1];
  const columnsPart = match[2];
  const valuesPart = match[3];

  let columns: string[] = [];
  if (columnsPart) {
    columns = columnsPart
      .split(',')
      .map(col => col.trim().replace(/^[`"\[]+|[`"\]]+$/g, ''));
  }

  const rowRegex = /\(\s*([^()]*(?:\([^()]*\)[^()]*)*)\s*\)/g;
  const rows: Array<(string | number | null)[]> = [];
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(valuesPart)) !== null) {
    const rowValues = parseValues(rowMatch[1]);
    rows.push(rowValues);
    
    if (columns.length === 0 && rowValues.length > 0) {
      columns = Array.from({ length: rowValues.length }, (_, i) => `Column${i + 1}`);
    }
  }

  if (rows.length === 0) return null;

  return {
    tableName,
    columns,
    rows,
    totalRows: rows.length,
  };
}

function parseValues(valuesString: string): (string | number | null)[] {
  const values: (string | number | null)[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  let escapeNext = false;

  for (let i = 0; i < valuesString.length; i++) {
    const char = valuesString[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      current += char;
      continue;
    }

    if (!inQuote && (char === '"' || char === "'")) {
      inQuote = true;
      quoteChar = char;
      current += char;
      continue;
    }

    if (inQuote && char === quoteChar) {
      if (i + 1 < valuesString.length && valuesString[i + 1] === quoteChar) {
        current += char;
        i++;
        continue;
      }
      inQuote = false;
      quoteChar = '';
      current += char;
      continue;
    }

    if (!inQuote && char === ',') {
      values.push(parseValue(current.trim()));
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    values.push(parseValue(current.trim()));
  }

  return values;
}

function parseValue(value: string): string | number | null {
  const trimmed = value.trim();

  if (trimmed.toUpperCase() === 'NULL') {
    return null;
  }

  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    let str = trimmed.slice(1, -1);
    str = str.replace(/''/g, "'").replace(/""/g, '"');
    return str;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  return trimmed;
}

const MAX_ROWS = 50;

export function DataPreview({ sql, theme: propTheme, headerComponent }: DataPreviewProps & { theme?: any }) {
  let theme = propTheme as Theme | undefined;
  if (!theme) {
    const themeHook = useTheme();
    theme = themeHook.theme;
  }
  
  // Fallback to lightTheme from imports if no theme provided
  const appliedTheme = theme || require('../styles/theme').lightTheme;
  const data = parseInsertStatement(sql);

  if (!data) {
    return null;
  }

  const displayRows = data.rows.slice(0, MAX_ROWS);

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: appliedTheme.surface }]}>
      {headerComponent || (
        <Text style={[styles.tableName, { color: appliedTheme.text }]}>
          {data.tableName}
        </Text>
      )}
    </View>
  );

  const renderTableHeader = () => (
    <View style={[styles.tableHeader, { borderBottomColor: appliedTheme.border }]}>
      {data.columns.map((column, index) => (
        <View
          key={`col-${index}`}
          style={[styles.headerCell, { borderRightColor: appliedTheme.border }]}
        >
          <Text style={[styles.headerText, { color: appliedTheme.text }]}>
            {column}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderRow = ({ item, index }: { item: (string | number | null)[]; index: number }) => (
    <View
      style={[
        styles.row,
        { borderBottomColor: appliedTheme.border },
        index % 2 === 1 && { backgroundColor: appliedTheme.surface },
      ]}
    >
      {item.map((cell, cellIndex) => (
        <View
          key={`cell-${index}-${cellIndex}`}
          style={[styles.cell, { borderRightColor: appliedTheme.border }]}
        >
          <Text
            style={[
              styles.cellText,
              { color: cell === null ? appliedTheme.textSecondary : appliedTheme.text },
            ]}
            numberOfLines={1}
          >
            {cell === null ? 'NULL' : String(cell)}
          </Text>
        </View>
      ))}
    </View>
  );

  const rowCountMessage = data.totalRows > MAX_ROWS ? `Showing ${MAX_ROWS} of ${data.totalRows} rows` : '';

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView horizontal>
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={displayRows}
            renderItem={renderRow}
            keyExtractor={(_, index) => `row-${index}`}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
      {rowCountMessage ? (
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: appliedTheme.textSecondary }]}>
            {rowCountMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tableName: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  tableContainer: {
    flex: 1,
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    backgroundColor: '#F9F9F9',
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    flex: 1,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    flex: 1,
  },
  cellText: {
    fontSize: 14,
  },
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 12,
  },
});
