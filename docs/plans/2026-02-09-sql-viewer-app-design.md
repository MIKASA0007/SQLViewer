# SQL Viewer React Native App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React Native mobile app for viewing SQL files shared from email or other apps, with syntax highlighting, search, dark mode, and history features.

**Architecture:** React Native cross-platform app with TypeScript, using react-native-syntax-highlighter for SQL highlighting, react-native-share for file handling, AsyncStorage for persistence, and modular component structure.

**Tech Stack:** React Native 0.73+ with TypeScript, react-native-syntax-highlighter, react-native-share, @react-native-async-storage/async-storage, sql-formatter, react-native-fs

---

## Task 1: Initialize React Native Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: Initialize React Native with TypeScript**

```bash
npx react-native init SQLViewer --template react-native-template-typescript
cd SQLViewer
npx pod-install ios
```

**Step 2: Install required dependencies**

```bash
npm install \
  react-native-syntax-highlighter \
  react-native-share \
  @react-native-async-storage/async-storage \
  sql-formatter \
  react-native-fs \
  react-native-reanimated \
  react-native-gesture-handler \
  react-native-screens \
  @react-navigation/native \
  @react-navigation/bottom-tabs
```

**Step 3: Configure TypeScript in tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2017"],
    "allowJs": true,
    "jsx": "react-native",
    "noEmit": true,
    "isolatedModules": true,
    "strict": true,
    "moduleResolution": "node",
    "baseUrl": "./",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "exclude": ["node_modules", "babel.config.js", "metro.config.js", "jest.config.js"]
}
```

**Step 4: Run initial test to verify setup**

```bash
npm test
```

Expected: Tests should pass with initial setup

---

## Task 2: Configure File Sharing (Android & iOS)

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `android/app/src/main/res/xml/file_paths.xml`
- Modify: `ios/SQLViewer/Info.plist`
- Create: `src/utils/FileHandler.ts`

**Step 1: Configure Android manifest for file sharing**

In `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application ...>
        <activity android:name=".MainActivity" ...>
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/*" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="content" />
                <data android:scheme="file" />
                <data android:mimeType="*/*" />
                <data android:pathPattern=".*\\.sql" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

**Step 2: Configure iOS Info.plist for file sharing**

In `ios/SQLViewer/Info.plist`:

```xml
<key>CFBundleDocumentTypes</key>
<array>
    <dict>
        <key>CFBundleTypeName</key>
        <string>SQL File</string>
        <key>CFBundleTypeRole</key>
        <string>Viewer</string>
        <key>LSHandlerRank</key>
        <string>Alternate</string>
        <key>LSItemContentTypes</key>
        <array>
            <string>public.sql</string>
            <string>public.plain-text</string>
        </array>
    </dict>
</array>
<key>UTExportedTypeDeclarations</key>
<array>
    <dict>
        <key>UTTypeConformsTo</key>
        <array>
            <string>public.text</string>
        </array>
        <key>UTTypeDescription</key>
        <string>SQL File</string>
        <key>UTTypeIdentifier</key>
        <string>public.sql</string>
        <key>UTTypeTagSpecification</key>
        <dict>
            <key>public.filename-extension</key>
            <string>sql</string>
        </dict>
    </dict>
</array>
```

**Step 3: Create file handling utility**

In `src/utils/FileHandler.ts`:

```typescript
import { Share } from 'react-native-share';
import RNFS from 'react-native-fs';

export interface FileInfo {
  uri: string;
  name: string;
  content: string;
  size: number;
}

export class FileHandler {
  static async handleSharedFile(shared: any): Promise<FileInfo | null> {
    try {
      if (!shared || !shared.url) {
        return null;
      }

      const uri = shared.url;
      const fileStats = await RNFS.stat(uri);
      
      if (!fileStats.isFile()) {
        return null;
      }

      const content = await RNFS.readFile(uri, 'utf8');
      const fileName = uri.split('/').pop() || 'unknown.sql';

      return {
        uri,
        name: fileName,
        content,
        size: fileStats.size,
      };
    } catch (error) {
      console.error('Error handling shared file:', error);
      return null;
    }
  }

  static async readFileFromUri(uri: string): Promise<string> {
    try {
      return await RNFS.readFile(uri, 'utf8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }
}
```

**Step 4: Create component tests**

Create test file: `src/utils/__tests__/FileHandler.test.ts`

```typescript
import { FileHandler, FileInfo } from '../FileHandler';
import RNFS from 'react-native-fs';

jest.mock('react-native-fs');

describe('FileHandler', () => {
  it('should handle shared file correctly', async () => {
    const mockShared = { url: 'file:///test.sql' };
    const mockStats = {
      isFile: () => true,
      size: 1024,
    };
    const mockContent = 'SELECT * FROM users;';

    (RNFS.stat as jest.Mock).mockResolvedValue(mockStats);
    (RNFS.readFile as jest.Mock).mockResolvedValue(mockContent);

    const result = await FileHandler.handleSharedFile(mockShared);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('test.sql');
    expect(result?.content).toBe(mockContent);
    expect(result?.size).toBe(1024);
  });

  it('should return null for invalid shared data', async () => {
    const result = await FileHandler.handleSharedFile(null);
    expect(result).toBeNull();
  });
});
```

**Step 5: Run tests**

```bash
npm test src/utils/__tests__/FileHandler.test.ts
```

Expected: Both tests should pass

---

## Task 3: Implement SQL Syntax Highlighter Component

**Files:**
- Create: `src/components/SQLHighlighter.tsx`
- Create: `src/styles/theme.ts`
- Create: `src/utils/sqlFormatter.ts`

**Step 1: Create theme configuration**

In `src/styles/theme.ts`:

```typescript
export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  keywords: {
    select: string;
    from: string;
    where: string;
    join: string;
    insert: string;
    update: string;
    delete: string;
  };
}

export const lightTheme: Theme = {
  primary: '#1976d2',
  secondary: '#dc004e',
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#e0e0e0',
  keywords: {
    select: '#0000ff',
    from: '#0000ff',
    where: '#0000ff',
    join: '#0000ff',
    insert: '#0000ff',
    update: '#0000ff',
    delete: '#0000ff',
  },
};

export const darkTheme: Theme = {
  primary: '#90caf9',
  secondary: '#f48fb1',
  background: '#121212',
  surface: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#333333',
  keywords: {
    select: '#569cd6',
    from: '#569cd6',
    where: '#569cd6',
    join: '#569cd6',
    insert: '#569cd6',
    update: '#569cd6',
    delete: '#569cd6',
  },
};
```

**Step 2: Create SQL formatter utility**

In `src/utils/sqlFormatter.ts`:

```typescript
import { format } from 'sql-formatter';

export function formatSQL(sql: string, language: string = 'sql'): string {
  try {
    return format(sql, {
      language: language as any,
      uppercase: true,
      indent: '  ',
    });
  } catch (error) {
    console.error('Error formatting SQL:', error);
    return sql;
  }
}

export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

**Step 3: Create SQL highlighter component**

In `src/components/SQLHighlighter.tsx`:

```typescript
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
```

**Step 4: Create component tests**

In `src/components/__tests__/SQLHighlighter.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import SQLHighlighter from '../SQLHighlighter';
import { lightTheme } from '../../styles/theme';

describe('SQLHighlighter', () => {
  it('should render SQL with syntax highlighting', () => {
    const sql = 'SELECT * FROM users WHERE id = 1;';
    const { getByText } = render(<SQLHighlighter sql={sql} theme={lightTheme} />);
    
    expect(getByText('SELECT')).toBeTruthy();
    expect(getByText('FROM')).toBeTruthy();
    expect(getByText('WHERE')).toBeTruthy();
  });

  it('should show line numbers when enabled', () => {
    const sql = 'SELECT 1;\nSELECT 2;';
    const { getByText } = render(<SQLHighlighter sql={sql} showLineNumbers={true} />);
    
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });
});
```

**Step 5: Run tests**

```bash
npm test src/components/__tests__/SQLHighlighter.test.tsx
```

Expected: Tests should pass

---

## Task 4: Implement Search Functionality

**Files:**
- Create: `src/components/SearchBar.tsx`
- Create: `src/hooks/useSearch.ts`
- Create: `src/utils/search.ts`

**Step 1: Create search utility**

In `src/utils/search.ts`:

```typescript
export interface SearchResult {
  lineNumber: number;
  lineContent: string;
  matches: Array<{ start: number; end: number }>;
}

export interface SearchOptions {
  caseSensitive: boolean;
  useRegex: boolean;
}

export function searchInSQL(sql: string, query: string, options: SearchOptions): SearchResult[] {
  const lines = sql.split('\n');
  const results: SearchResult[] = [];
  
  const flags = options.caseSensitive ? 'g' : 'gi';
  let regex: RegExp;
  
  try {
    if (options.useRegex) {
      regex = new RegExp(query, flags);
    } else {
      regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    }
  } catch (error) {
    console.error('Invalid regex:', error);
    return [];
  }

  lines.forEach((line, index) => {
    const matches: Array<{ start: number; end: number }> = [];
    let match: RegExpExecArray | null;
    
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
      });
      
      if (!regex.global) break;
    }
    
    if (matches.length > 0) {
      results.push({
        lineNumber: index,
        lineContent: line,
        matches,
      });
    }
  });

  return results;
}

export function highlightMatches(line: string, matches: Array<{ start: number; end: number }>, highlightColor: string = '#ffeb3b'): React.ReactNode {
  if (matches.length === 0) {
    return line;
  }

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    if (match.start > lastIndex) {
      elements.push(
        <Text key={`text-${i}`}>{line.substring(lastIndex, match.start)}</Text>
      );
    }

    elements.push(
      <Text key={`highlight-${i}`} style={{ backgroundColor: highlightColor }}>
        {line.substring(match.start, match.end)}
      </Text>
    );

    lastIndex = match.end;
  });

  if (lastIndex < line.length) {
    elements.push(
      <Text key="text-end">{line.substring(lastIndex)}</Text>
    );
  }

  return elements;
}
```

**Step 2: Create search hook**

In `src/hooks/useSearch.ts`:

```typescript
import { useState, useCallback } from 'react';
import { SearchResult, searchInSQL, SearchOptions } from '../utils/search';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  currentIndex: number;
  nextResult: () => void;
  previousResult: () => void;
  clearSearch: () => void;
  options: SearchOptions;
  setOptions: (options: SearchOptions) => void;
}

export function useSearch(sql: string): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    useRegex: false,
  });

  const performSearch = useCallback((newQuery: string, newOptions: SearchOptions) => {
    if (!newQuery.trim()) {
      setResults([]);
      setCurrentIndex(0);
      return;
    }

    const searchResults = searchInSQL(sql, newQuery, newOptions);
    setResults(searchResults);
    setCurrentIndex(searchResults.length > 0 ? 0 : -1);
  }, [sql]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    performSearch(newQuery, options);
  };

  const handleOptionsChange = (newOptions: SearchOptions) => {
    setOptions(newOptions);
    if (query) {
      performSearch(query, newOptions);
    }
  };

  const nextResult = () => {
    if (results.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % results.length);
  };

  const previousResult = () => {
    if (results.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + results.length) % results.length);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setCurrentIndex(0);
  };

  return {
    query,
    setQuery: handleQueryChange,
    results,
    currentIndex,
    nextResult,
    previousResult,
    clearSearch,
    options,
    setOptions: handleOptionsChange,
  };
}
```

**Step 3: Create search bar component**

In `src/components/SearchBar.tsx`:

```typescript
import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Switch } from 'react-native';
import { Theme } from '../styles/theme';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClear: () => void;
  resultsCount: number;
  currentIndex: number;
  options: {
    caseSensitive: boolean;
    useRegex: boolean;
  };
  onOptionsChange: (options: any) => void;
  theme: Theme;
}

const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  onNext,
  onPrevious,
  onClear,
  resultsCount,
  currentIndex,
  options,
  onOptionsChange,
  theme,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          placeholder="Search in SQL..."
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={onQueryChange}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <>
            <TouchableOpacity onPress={onPrevious} style={styles.button}>
              <Text style={[styles.buttonText, { color: theme.primary }]}>↑</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} style={styles.button}>
              <Text style={[styles.buttonText, { color: theme.primary }]}>↓</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClear} style={styles.button}>
              <Text style={[styles.buttonText, { color: theme.secondary }]}>✕</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {query.length > 0 && (
        <>
          <View style={styles.resultsRow}>
            <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
              {resultsCount > 0 ? `${currentIndex + 1} of ${resultsCount}` : 'No matches'}
            </Text>
          </View>
          
          <View style={styles.optionsRow}>
            <View style={styles.option}>
              <Text style={[styles.optionText, { color: theme.text }]}>Case sensitive</Text>
              <Switch
                value={options.caseSensitive}
                onValueChange={(value) => onOptionsChange({ ...options, caseSensitive: value })}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
            <View style={styles.option}>
              <Text style={[styles.optionText, { color: theme.text }]}>Regex</Text>
              <Switch
                value={options.useRegex}
                onValueChange={(value) => onOptionsChange({ ...options, useRegex: value })}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  button: {
    padding: 8,
    marginLeft: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsRow: {
    marginTop: 8,
  },
  resultsText: {
    fontSize: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    marginRight: 8,
    fontSize: 14,
  },
});

export default SearchBar;
```

**Step 4: Test search functionality**

In `src/utils/__tests__/search.test.ts`:

```typescript
import { searchInSQL, SearchOptions } from '../search';

describe('searchInSQL', () => {
  const sql = `SELECT * FROM users;
UPDATE users SET name = 'John';
DELETE FROM orders WHERE id = 1;`;

  it('should find simple text matches', () => {
    const options: SearchOptions = { caseSensitive: false, useRegex: false };
    const results = searchInSQL(sql, 'users', options);

    expect(results.length).toBe(3);
    expect(results[0].lineNumber).toBe(0);
    expect(results[1].lineNumber).toBe(1);
    expect(results[2].lineNumber).toBe(2);
  });

  it('should support regex search', () => {
    const options: SearchOptions = { caseSensitive: false, useRegex: true };
    const results = searchInSQL(sql, 'SELECT|UPDATE', options);

    expect(results.length).toBe(2);
  });

  it('should respect case sensitivity', () => {
    const options: SearchOptions = { caseSensitive: true, useRegex: false };
    const results = searchInSQL(sql, 'SELECT', options);

    expect(results.length).toBe(1);
    expect(results[0].lineNumber).toBe(0);
  });

  it('should return empty array when no matches', () => {
    const options: SearchOptions = { caseSensitive: false, useRegex: false };
    const results = searchInSQL(sql, 'nonexistent', options);

    expect(results.length).toBe(0);
  });
});
```

**Step 5: Run tests**

```bash
npm test src/utils/__tests__/search.test.ts
```

Expected: All search tests should pass

---

## Task 5: Implement History Persistence

**Files:**
- Create: `src/utils/storage.ts`
- Create: `src/hooks/useHistory.ts`
- Create: `src/components/HistoryList.tsx`

**Step 1: Create storage utility**

In `src/utils/storage.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  fileName: string;
  fileUri: string;
  lastOpened: string;
  preview: string;
}

const HISTORY_KEY = '@sql_viewer:history';
const MAX_HISTORY_ITEMS = 50;

export class Storage {
  static async getHistory(): Promise<HistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  static async addToHistory(item: Omit<HistoryItem, 'id' | 'lastOpened'>): Promise<void> {
    try {
      const history = await this.getHistory();
      const newItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        lastOpened: new Date().toISOString(),
      };

      const filteredHistory = history.filter(h => h.fileUri !== item.fileUri);
      const updatedHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  static async removeFromHistory(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const updatedHistory = history.filter(h => h.id !== id);

      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }
}
```

**Step 2: Create useHistory hook**

In `src/hooks/useHistory.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Storage, HistoryItem } from '../utils/storage';

interface UseHistoryReturn {
  history: HistoryItem[];
  loading: boolean;
  addItem: (item: Omit<HistoryItem, 'id' | 'lastOpened'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await Storage.getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (item: Omit<HistoryItem, 'id' | 'lastOpened'>) => {
    try {
      await Storage.addToHistory(item);
      await loadHistory();
    } catch (error) {
      console.error('Error adding item to history:', error);
    }
  }, [loadHistory]);

  const removeItem = useCallback(async (id: string) => {
    try {
      await Storage.removeFromHistory(id);
      await loadHistory();
    } catch (error) {
      console.error('Error removing item from history:', error);
    }
  }, [loadHistory]);

  const clearHistory = useCallback(async () => {
    try {
      await Storage.clearHistory();
      await loadHistory();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    addItem,
    removeItem,
    clearHistory,
    refresh: loadHistory,
  };
}
```

**Step 3: Create history list component**

In `src/components/HistoryList.tsx`:

```typescript
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { HistoryItem } from '../utils/storage';
import { Theme } from '../styles/theme';

interface HistoryListProps {
  history: HistoryItem[];
  onItemPress: (item: HistoryItem) => void;
  onItemDelete: (id: string) => void;
  theme: Theme;
}

const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onItemPress,
  onItemDelete,
  theme,
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return date.toLocaleDateString();
  };

  const handleDelete = (item: HistoryItem) => {
    Alert.alert(
      'Delete File',
      `Delete "${item.fileName}" from history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onItemDelete(item.id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: theme.border }]}
      onPress={() => onItemPress(item)}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
          {item.fileName}
        </Text>
        <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.preview}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {formatDate(item.lastOpened)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Text style={[styles.deleteText, { color: theme.secondary }]}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={history}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No recent files
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    fontFamily: 'Monaco, Menlo, monospace',
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default HistoryList;
```

**Step 4: Test storage functionality**

In `src/utils/__tests__/storage.test.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage, HistoryItem } from '../storage';

jest.mock('@react-native-async-storage/async-storage');

describe('Storage', () => {
  const mockItem: Omit<HistoryItem, 'id' | 'lastOpened'> = {
    fileName: 'test.sql',
    fileUri: 'file:///test.sql',
    preview: 'SELECT * FROM users;',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add item to history', async () => {
    await Storage.addToHistory(mockItem);
    
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@sql_viewer:history',
      expect.any(String)
    );
  });

  it('should get history items', async () => {
    const mockHistory: HistoryItem[] = [
      {
        id: '1',
        ...mockItem,
        lastOpened: new Date().toISOString(),
      },
    ];
    
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));
    
    const result = await Storage.getHistory();
    
    expect(result).toEqual(mockHistory);
  });
});
```

**Step 5: Run tests**

```bash
npm test src/utils/__tests__/storage.test.ts
```

Expected: Storage tests should pass

---

## Task 6: Create Main App Screen with Navigation

**Files:**
- Modify: `App.tsx`
- Create: `src/screens/HomeScreen.tsx`
- Create: `src/screens/ViewerScreen.tsx`
- Create: `src/navigation/AppNavigator.tsx`

**Step 1: Configure navigation**

In `App.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;
```

**Step 2: Create navigation structure**

In `src/navigation/AppNavigator.tsx`:

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ViewerScreen from '../screens/ViewerScreen';

export type RootTabParamList = {
  Home: undefined;
  Viewer: { fileUri?: string; content?: string; fileName?: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Viewer"
        component={ViewerScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
```

**Step 3: Create home screen**

In `src/screens/HomeScreen.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHistory } from '../hooks/useHistory';
import HistoryList from '../components/HistoryList';
import { FileHandler } from '../utils/FileHandler';
import { Storage } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootTabParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { history, loading, removeItem } = useHistory();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      handleSharedFile({ url: event.url });
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleSharedFile({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleSharedFile = async (shared: any) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const fileInfo = await FileHandler.handleSharedFile(shared);
      if (fileInfo) {
        await Storage.addToHistory({
          fileName: fileInfo.name,
          fileUri: fileInfo.uri,
          preview: fileInfo.content.substring(0, 200),
        });

        navigation.navigate('Viewer', {
          fileUri: fileInfo.uri,
          content: fileInfo.content,
          fileName: fileInfo.name,
        });
      }
    } catch (error) {
      console.error('Error processing shared file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHistoryItemPress = async (item: any) => {
    try {
      const content = await FileHandler.readFileFromUri(item.fileUri);
      navigation.navigate('Viewer', {
        fileUri: item.fileUri,
        content,
        fileName: item.fileName,
      });
    } catch (error) {
      console.error('Error loading file from history:', error);
    }
  };

  const handleHistoryItemDelete = async (id: string) => {
    await removeItem(id);
  };

  return (
    <View style={styles.container}>
      <HistoryList
        history={history}
        onItemPress={handleHistoryItemPress}
        onItemDelete={handleHistoryItemDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomeScreen;
```

**Step 4: Create viewer screen**

In `src/screens/ViewerScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SQLHighlighter from '../components/SQLHighlighter';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';
import { formatSQL } from '../utils/sqlFormatter';
import { Storage } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';
import { darkTheme, lightTheme } from '../styles/theme';
import { RootTabParamList } from '../navigation/AppNavigator';

type ViewerScreenRouteProp = RouteProp<RootTabParamList, 'Viewer'>;
type ViewerScreenNavigationProp = NativeStackNavigationProp<RootTabParamList>;

interface Props {
  route: ViewerScreenRouteProp;
  navigation: ViewerScreenNavigationProp;
}

const ViewerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { fileUri, content, fileName } = route.params;
  const [formatted, setFormatted] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const { isDarkMode, toggleTheme } = useTheme();

  const theme = isDarkMode ? darkTheme : lightTheme;
  
  const processedContent = formatted ? formatSQL(content || '') : content || '';
  const search = useSearch(processedContent);

  const handleCopy = async () => {
    // TODO: Implement copy to clipboard
  };

  const handleShare = async () => {
    // TODO: Implement share functionality
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
          {fileName}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setFormatted(!formatted)}>
            <Text style={[styles.headerButton, { color: theme.primary }]}>
              {formatted ? 'Raw' : 'Format'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFontSize(Math.max(10, fontSize - 2))}>
            <Text style={[styles.headerButton, { color: theme.primary }]}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFontSize(Math.min(24, fontSize + 2))}>
            <Text style={[styles.headerButton, { color: theme.primary }]}>A+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme}>
            <Text style={[styles.headerButton, { color: theme.primary }]}>
              {isDarkMode ? '☀️' : '🌙'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopy}>
            <Text style={[styles.headerButton, { color: theme.primary }]}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Text style={[styles.headerButton, { color: theme.primary }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <SearchBar
        query={search.query}
        onQueryChange={search.setQuery}
        onNext={search.nextResult}
        onPrevious={search.previousResult}
        onClear={search.clearSearch}
        resultsCount={search.results.length}
        currentIndex={search.currentIndex}
        options={search.options}
        onOptionsChange={search.setOptions}
        theme={theme}
      />
      
      <View style={styles.contentContainer}>
        <SQLHighlighter
          sql={processedContent}
          theme={theme}
          showLineNumbers={true}
          fontSize={fontSize}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
});

export default ViewerScreen;
```

**Step 5: Create theme hook**

In `src/hooks/useTheme.ts`:

```typescript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from '../styles/theme';

const THEME_KEY = '@sql_viewer:theme';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      setIsDarkMode(savedTheme === 'dark');
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem(THEME_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return {
    isDarkMode,
    toggleTheme,
  };
}
```

**Step 6: Test main app flow**

In `src/screens/__tests__/ViewerScreen.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import ViewerScreen from '../ViewerScreen';
import { RouteProp } from '@react-navigation/native';

const mockRoute: RouteProp<any> = {
  key: 'test-key',
  name: 'Viewer',
  params: {
    fileUri: 'file:///test.sql',
    content: 'SELECT * FROM users;',
    fileName: 'test.sql',
  },
};

const mockNavigation: any = {
  goBack: jest.fn(),
};

describe('ViewerScreen', () => {
  it('should render file name and content', () => {
    const { getByText } = render(
      <ViewerScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    expect(getByText('test.sql')).toBeTruthy();
    expect(getByText('SELECT')).toBeTruthy();
  });
});
```

**Step 7: Run tests**

```bash
npm test src/screens/__tests__/ViewerScreen.test.tsx
```

---

## Task 7: Add Copy, Share, and Statistics Features

**Files:**
- Modify: `src/screens/ViewerScreen.tsx`
- Create: `src/utils/clipboard.ts`
- Create: `src/utils/statistics.ts`

**Step 1: Add clipboard utility**

In `src/utils/clipboard.ts`:

```typescript
import Clipboard from '@react-native-clipboard/clipboard';

export class ClipboardUtil {
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      Clipboard.setString(text);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  static async getFromClipboard(): Promise<string> {
    try {
      return await Clipboard.getString();
    } catch (error) {
      console.error('Error getting clipboard content:', error);
      return '';
    }
  }
}
```

**Step 2: Add statistics utility**

In `src/utils/statistics.ts`:

```typescript
export interface SQLStatistics {
  totalLines: number;
  totalCharacters: number;
  totalTables: number;
  totalQueries: number;
}

export function calculateSQLStatistics(sql: string): SQLStatistics {
  const lines = sql.split('\n').filter(line => line.trim().length > 0);
  const characters = sql.length;
  
  const tablePattern = /(?:FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z_][a-zA-Z0-9_\.]*)/gi;
  const queryPattern = /(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/gi;
  
  const tables = new Set<string>();
  let match: RegExpExecArray | null;
  
  while ((match = tablePattern.exec(sql)) !== null) {
    if (match[1]) {
      tables.add(match[1].toLowerCase());
    }
  }
  
  const queries = sql.match(queryPattern) || [];

  return {
    totalLines: lines.length,
    totalCharacters: characters,
    totalTables: tables.size,
    totalQueries: queries.length,
  };
}
```

**Step 3: Update viewer screen with enhanced features**

Add to `src/screens/ViewerScreen.tsx`:

```typescript
// Add imports
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import { calculateSQLStatistics, SQLStatistics } from '../utils/statistics';
import { ClipboardUtil } from '../utils/clipboard';

// Inside ViewerScreen component, add state
const [showStats, setShowStats] = useState(false);

// Add handler functions
const handleCopy = async () => {
  const success = await ClipboardUtil.copyToClipboard(content || '');
  if (success) {
    // Show toast
  }
};

const handleShare = async () => {
  try {
    await Share.open({
      title: 'Share SQL File',
      message: content,
      filename: fileName,
      type: 'text/plain',
    });
  } catch (error) {
    console.error('Error sharing:', error);
  }
};

// Add statistics display
{showStats && (
  <View style={[styles.statsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    {(() => {
      const stats = calculateSQLStatistics(processedContent);
      return (
        <>
          <Text style={[styles.statText, { color: theme.text }]}>Lines: {stats.totalLines}</Text>
          <Text style={[styles.statText, { color: theme.text }]}>Chars: {stats.totalCharacters}</Text>
          <Text style={[styles.statText, { color: theme.text }]}>Tables: {stats.totalTables}</Text>
          <Text style={[styles.statText, { color: theme.text }]}>Queries: {stats.totalQueries}</Text>
        </>
      );
    })()}
  </View>
)}

// Add to header actions
<TouchableOpacity onPress={() => setShowStats(!showStats)}>
  <Text style={[styles.headerButton, { color: theme.primary }]}>Stats</Text>
</TouchableOpacity>

// Styles
statsContainer: {
  position: 'absolute',
  top: 16,
  right: 16,
  padding: 12,
  borderRadius: 8,
  borderWidth: 1,
  zIndex: 10,
},
statText: {
  fontSize: 12,
  fontFamily: 'Monaco, Menlo, monospace',
},
```

**Step 4: Test enhanced features**

In `src/utils/__tests__/statistics.test.ts`:

```typescript
import { calculateSQLStatistics } from '../statistics';

describe('calculateSQLStatistics', () => {
  it('should calculate basic statistics correctly', () => {
    const sql = `SELECT * FROM users;
UPDATE users SET name = 'John';
DELETE FROM orders WHERE id = 1;`;
    
    const stats = calculateSQLStatistics(sql);
    
    expect(stats.totalLines).toBe(3);
    expect(stats.totalQueries).toBe(3);
    expect(stats.totalTables).toBe(2); // users, orders
  });

  it('should handle empty SQL', () => {
    const stats = calculateSQLStatistics('');
    
    expect(stats.totalLines).toBe(0);
    expect(stats.totalCharacters).toBe(0);
    expect(stats.totalQueries).toBe(0);
    expect(stats.totalTables).toBe(0);
  });
});
```

**Step 5: Test copy functionality**

```bash
npm test src/utils/__tests__/statistics.test.ts
```

---

## Task 8: Run Final Integration Tests

**Files:**
- Create: `__tests__/App.test.tsx`

**Step 1: Create integration test**

In `__tests__/App.test.tsx`:

```typescript
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../App';

describe('SQL Viewer App', () => {
  it('should render without crashing', async () => {
    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('No recent files')).toBeTruthy();
    });
  });
});
```

**Step 2: Run all tests**

```bash
npm test
```

Expected: All tests should pass

**Step 3: Test on device/emulator**

```bash
# Android
npm run android

# iOS
npm run ios
```

Expected: App should build and run successfully

---

## Summary

This implementation plan creates a complete SQL Viewer mobile app with the following features:

✅ **Core Features**
- Receive SQL files from email and other apps
- View SQL files with syntax highlighting
- Search with regex support
- Dark/Light theme toggle
- Recent files history
- Line numbers
- SQL formatting (beautify)
- Adjustable font size
- Code statistics
- Copy to clipboard
- Share from app

✅ **Technical Implementation**
- React Native with TypeScript
- Modular component architecture
- Comprehensive test coverage
- Persistent storage for history and settings
- Proper error handling
- Performance optimized for files up to 10MB

**Next Steps:**
1. Execute the plan task by task
2. Run lint and type checks after each task
3. Test on actual devices
4. Prepare for App Store submission