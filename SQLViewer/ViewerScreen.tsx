/** @format */

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import {docco, dark} from 'react-syntax-highlighter/styles/prism';
import * as RNFS from 'react-native-fs';
import {format} from 'sql-formatter';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import useTheme from './useTheme';
import AIAssistant from './src/components/AIAssistant';

interface ViewerScreenProps {
  route: RouteProp<RootStackParamList, 'Viewer'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Viewer'>;
}

function ViewerScreen({route, navigation}: ViewerScreenProps): React.JSX.Element {
  const {filePath} = route.params;
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {theme, isDarkMode} = useTheme();

  const getLanguage = useCallback((path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      json: 'json',
      css: 'css',
      sql: 'sql',
      md: 'markdown',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
    };
    return languageMap[ext] || 'text';
  }, []);

  const formatContent = useCallback(
    (text: string, language: string): string => {
      if (language === 'sql') {
        try {
          return format(text);
        } catch {
          return text;
        }
      }
      return text;
    },
    [],
  );

  const loadFile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const language = getLanguage(filePath);
      const formattedContent = formatContent(fileContent, language);

      setContent(formattedContent);
    } catch (err) {
      setError('Failed to load file. Please try again.');
      console.error('Error loading file:', err);
    } finally {
      setLoading(false);
    }
  }, [filePath, getLanguage, formatContent]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShare}
          style={styles.headerButton}
          testID="share-button">
          <Text style={[styles.headerButtonText, {color: theme.text}]}>
            Share
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, content, theme]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: 'Share file content',
        message: content,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share content');
      console.error('Error sharing content:', err);
    }
  }, [content]);

  const language = getLanguage(filePath);
  const syntaxStyle = isDarkMode ? dark : docco;

  if (loading) {
    return (
      <View style={[styles.centerContainer, {backgroundColor: theme.background}]}>
        <ActivityIndicator size="large" color={theme.primary} testID="loading-indicator" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, {backgroundColor: theme.background}]}>
        <Text style={[styles.errorText, {color: theme.error}]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <ScrollView style={styles.scrollView}>
        <SyntaxHighlighter
          language={language}
          style={syntaxStyle}
          customStyle={styles.syntaxHighlighter}
          testID="syntax-highlighter">
          {content}
        </SyntaxHighlighter>
      </ScrollView>
      <AIAssistant sqlContent={content} serverUrl="http://10.0.2.2:3001" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  syntaxHighlighter: {
    margin: 0,
    padding: 16,
  },
  headerButton: {
    marginRight: 16,
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ViewerScreen;
