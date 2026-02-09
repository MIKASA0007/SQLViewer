import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Theme, lightTheme } from '../styles/theme';

interface SQLHighlighterProps {
  sql: string;
  theme?: Theme;
  showLineNumbers?: boolean;
  fontSize?: number;
}

const SQLHighlighter: React.FC<SQLHighlighterProps> = ({
  sql,
  theme = lightTheme,
  showLineNumbers = true,
  fontSize = 14,
}) => {
  const lines = sql.split('\n');
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'ON', 'AS', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'NOT', 'NULL', 'AND', 'OR', 'IN', 'LIKE', 'BETWEEN', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'];

  const highlightLine = (line: string, index: number): React.ReactNode => {
    const parts = line.split(/\s+/);
    const highlightedParts = parts.map((part, i) => {
      const isKeyword = keywords.includes(part.toUpperCase());
      const isString = part.startsWith("'") || part.startsWith('"');
      const isNumber = /^\d+$/.test(part);

      let color = theme.text;
      if (isKeyword) {
        color = theme.keywords.select;
      } else if (isString) {
        color = '#008000';
      } else if (isNumber) {
        color = '#ff6600';
      }

      return (
        <Text key={i} style={{ color, fontFamily: 'Monaco, Menlo, monospace', fontSize }}>
          {part}{i < parts.length - 1 ? ' ' : ''}
        </Text>
      );
    });

    return (
      <View key={index} style={styles.line}>
        {showLineNumbers && (
          <Text style={[styles.lineNumber, { color: theme.textSecondary, fontSize }]}>
            {index + 1}
          </Text>
        )}
        {highlightedParts}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {lines.map((line, index) => highlightLine(line, index))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  line: {
    flexDirection: 'row',
    lineHeight: 20,
  },
  lineNumber: {
    minWidth: 40,
    textAlign: 'right',
    marginRight: 8,
    fontFamily: 'Monaco, Menlo, monospace',
    opacity: 0.5,
  },
});

export default SQLHighlighter;
