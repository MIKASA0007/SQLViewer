import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import SQLHighlighter from './SQLHighlighter';
import { Theme } from '../styles/theme';
import { format } from 'sql-formatter';

interface CodeDisplayProps {
  content: string;
  isDarkMode: boolean;
  onShare?: () => void;
}

const codeLightTheme: Theme = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  keywords: {
    select: '#007bff',
    from: '#007bff',
    where: '#007bff',
    join: '#007bff',
    insert: '#007bff',
    update: '#007bff',
    delete: '#007bff',
  },
};

const codeDarkTheme: Theme = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#1C1C1E',
  surface: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#ABABAB',
  border: '#3C3C3E',
  keywords: {
    select: '#64B5F6',
    from: '#64B5F6',
    where: '#64B5F6',
    join: '#64B5F6',
    insert: '#64B5F6',
    update: '#64B5F6',
    delete: '#64B5F6',
  },
};

function CodeDisplay({ content, isDarkMode, onShare }: CodeDisplayProps): React.JSX.Element {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [formattedContent, setFormattedContent] = React.useState<string>(content);
  const [showOriginal, setShowOriginal] = React.useState<boolean>(true);

  const handleFormat = React.useCallback(() => {
    if (!showOriginal) {
      setShowOriginal(true);
      return;
    }

    setLoading(true);
    try {
      const formatted = format(content);
      setFormattedContent(formatted);
      setShowOriginal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to format SQL');
      console.error('SQL formatting error:', error);
    } finally {
      setLoading(false);
    }
  }, [content, showOriginal]);

  const theme = isDarkMode ? codeDarkTheme : codeLightTheme;
  const displayContent = showOriginal ? content : formattedContent;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.toolbar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.toolbarButton, { backgroundColor: theme.primary }]}
          onPress={handleFormat}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.toolbarButtonText, { color: '#FFFFFF' }]}>
              {showOriginal ? 'Format' : 'Original'}
            </Text>
          )}
        </TouchableOpacity>

        {onShare && (
          <TouchableOpacity
            style={[styles.toolbarButton, { backgroundColor: theme.primary }]}
            onPress={onShare}>
            <Text style={[styles.toolbarButtonText, { color: '#FFFFFF' }]}>
              Share
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.highlighterContainer}>
        <SQLHighlighter 
          sql={displayContent} 
          theme={theme}
          showLineNumbers={true}
          fontSize={13}
        />
      </View>
    </View>
  );
}

const lightTheme = {
  background: '#FFFFFF',
  toolbar: '#F5F5F5',
  border: '#E0E0E0',
  buttonBackground: '#007AFF',
  buttonText: '#FFFFFF',
  primary: '#007AFF',
  secondary: '#5856D6',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  keywords: '#007bff',
};

const darkTheme = {
  background: '#1C1C1E',
  toolbar: '#2C2C2E',
  border: '#3C3C3E',
  buttonBackground: '#0A84FF',
  buttonText: '#FFFFFF',
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  surface: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#ABABAB',
  keywords: '#64B5F6',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    justifyContent: 'space-around',
  },
  toolbarButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  highlighterContainer: {
    flex: 1,
  },
  syntaxHighlighter: {
    margin: 0,
    padding: 16,
    fontSize: 13,
    lineHeight: 20,
  },
});

export default CodeDisplay;
