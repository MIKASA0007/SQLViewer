import React, { useMemo, memo } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Theme, lightTheme } from '../styles/theme';

interface SQLHighlighterProps {
  sql: string;
  theme?: Theme;
  showLineNumbers?: boolean;
  fontSize?: number;
}

// 预编译的关键词集合（O(1)查找）
const SQL_KEYWORDS_SET = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 
  'ON', 'AS', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 
  'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'PRIMARY', 'KEY', 
  'FOREIGN', 'REFERENCES', 'UNIQUE', 'NOT', 'NULL', 'AND', 'OR', 
  'IN', 'LIKE', 'BETWEEN', 'GROUP', 'BY', 'ORDER', 'HAVING', 
  'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'UNION', 'ALL',
  'DEFAULT', 'CHECK', 'CASCADE', 'RESTRICT'
]);

const SQL_DATA_TYPES_SET = new Set([
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'DECIMAL', 'NUMERIC',
  'FLOAT', 'REAL', 'DOUBLE', 'BOOLEAN', 'BOOL', 'CHAR', 'VARCHAR',
  'TEXT', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'BLOB'
]);

const SQL_FUNCTIONS_SET = new Set([
  'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'COALESCE', 'NULLIF', 'CAST',
  'CONVERT', 'SUBSTRING', 'UPPER', 'LOWER', 'TRIM', 'LENGTH', 'NOW',
  'GETDATE', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP'
]);

// 样式缓存
const styleCache = new Map<string, { color: string; fontWeight: 'normal' | 'bold'; fontStyle: 'normal' | 'italic' }>();

const getTokenStyle = (token: string): { color: string; fontWeight: 'normal' | 'bold'; fontStyle: 'normal' | 'italic' } => {
  if (styleCache.has(token)) {
    return styleCache.get(token)!;
  }

  const upper = token.toUpperCase();
  let result: { color: string; fontWeight: 'normal' | 'bold'; fontStyle: 'normal' | 'italic' };
  
  if (SQL_KEYWORDS_SET.has(upper)) {
    result = { color: '#007bff', fontWeight: 'bold', fontStyle: 'normal' };
  } else if (SQL_DATA_TYPES_SET.has(upper)) {
    result = { color: '#905', fontWeight: 'normal', fontStyle: 'normal' };
  } else if (SQL_FUNCTIONS_SET.has(upper)) {
    result = { color: '#708', fontWeight: 'normal', fontStyle: 'normal' };
  } else if (/^['"].*['"]$/.test(token)) {
    result = { color: '#690', fontWeight: 'normal', fontStyle: 'normal' };
  } else if (/^\d+(\.\d+)?$/.test(token)) {
    result = { color: '#905', fontWeight: 'normal', fontStyle: 'normal' };
  } else if (token.startsWith('--') || token.startsWith('/*')) {
    result = { color: '#6a737d', fontWeight: 'normal', fontStyle: 'italic' };
  } else {
    result = { color: '#000000', fontWeight: 'normal', fontStyle: 'normal' };
  }

  if (styleCache.size < 1000) {
    styleCache.set(token, result);
  }

  return result;
};

// 简化的tokenize函数
const tokenizeLineFast = (line: string): Array<{ text: string; style: any }> => {
  if (!line) return [];
  
  const tokens: Array<{ text: string; style: any }> = [];
  const parts = line.split(/(\s+|[(),;=<>!])/);
  
  for (const part of parts) {
    if (!part) continue;
    
    if (/^\s+$/.test(part)) {
      tokens.push({ text: part, style: { color: '#000000', fontWeight: 'normal', fontStyle: 'normal' } });
    } else if (/^[(),;=<>!]/.test(part)) {
      tokens.push({ text: part, style: { color: '#000000', fontWeight: 'normal', fontStyle: 'normal' } });
    } else if (part.startsWith('--') || part.startsWith('/*')) {
      tokens.push({ text: line.substring(line.indexOf(part)), style: getTokenStyle(part) });
      break;
    } else {
      tokens.push({ text: part, style: getTokenStyle(part) });
    }
  }
  
  return tokens;
};

// 计算行宽
const calculateLineWidth = (line: string, fontSize: number, showLineNumbers: boolean): number => {
  const charWidth = fontSize * 0.6;
  const lineNumberWidth = showLineNumbers ? 52 : 0;
  return lineNumberWidth + (line.length * charWidth) + 32;
};

// 行渲染组件 - 简化版，不使用太多计算
const LineItem = memo(({ 
  line, 
  lineNumber, 
  fontSize, 
  showLineNumbers, 
  maxWidth 
}: { 
  line: string; 
  lineNumber: number; 
  fontSize: number;
  showLineNumbers: boolean;
  maxWidth: number;
}) => {
  return (
    <View style={styles.line}>
      {showLineNumbers && (
        <Text style={[styles.lineNumber, { fontSize }]}>
          {lineNumber.toString()}
        </Text>
      )}
      <View style={[styles.lineContent, { minWidth: Math.max(maxWidth, calculateLineWidth(line, fontSize, showLineNumbers)) }]}>
        {tokenizeLineFast(line).map((token, idx) => (
          <Text
            key={`${idx}-${token.text}`}
            style={{
              ...token.style,
              fontSize,
              fontFamily: 'monospace',
            }}
          >
            {token.text}
          </Text>
        ))}
      </View>
    </View>
  );
});

const SQLHighlighter: React.FC<SQLHighlighterProps> = memo(({
  sql,
  theme = lightTheme,
  showLineNumbers = true,
  fontSize = 14,
}) => {
  const lines = useMemo(() => sql.split('\n'), [sql]);
  
  // 计算最大宽度（只检查前200行，避免性能问题）
  const maxWidth = useMemo(() => {
    let max = 1000;
    const checkLines = Math.min(lines.length, 200);
    for (let i = 0; i < checkLines; i++) {
      const w = calculateLineWidth(lines[i], fontSize, showLineNumbers);
      if (w > max) max = w;
    }
    return max;
  }, [lines, fontSize, showLineNumbers]);

  return (
    <ScrollView 
      horizontal={true}
      showsHorizontalScrollIndicator={true}
      bounces={true}
      contentContainerStyle={styles.horizontalScroll}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        bounces={true}
      >
        <View style={{ minWidth: maxWidth }}>
          {lines.map((line, index) => (
            <LineItem
              key={`line-${index}`}
              line={line}
              lineNumber={index + 1}
              fontSize={fontSize}
              showLineNumbers={showLineNumbers}
              maxWidth={maxWidth}
            />
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  horizontalScroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 8,
  },
  line: {
    flexDirection: 'row',
    minHeight: 22,
  },
  lineNumber: {
    minWidth: 40,
    textAlign: 'right',
    marginRight: 12,
    fontFamily: 'monospace',
    opacity: 0.5,
    color: '#666',
  },
  lineContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default SQLHighlighter;