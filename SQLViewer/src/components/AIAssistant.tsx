import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Animated, Dimensions, Keyboard, ActivityIndicator } from 'react-native';
import useTheme from '../hooks/useTheme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens?: { inputTokens: number; outputTokens: number; totalTokens: number };
}

interface AIAssistantProps { sqlContent?: string; serverUrl?: string; }

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const EXPANDED_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 400);
const EXPANDED_HEIGHT = Math.min(SCREEN_HEIGHT * 0.6, 500);

const PRESET_QUESTIONS = [
  { id: '1', label: '分析SQL健壮性', prompt: '请分析这个SQL语句的健壮性，包括可能的数据类型问题、边界条件处理等' },
  { id: '2', label: '查找潜在bug', prompt: '请查找这个SQL语句中可能存在的bug或逻辑错误' },
  { id: '3', label: '性能优化建议', prompt: '请给出这个SQL语句的性能优化建议' },
  { id: '4', label: '安全漏洞检查', prompt: '请检查这个SQL语句是否存在安全漏洞，如SQL注入风险' },
];

function AIAssistant({ sqlContent = '', serverUrl = 'http://localhost:3001' }: AIAssistantProps): React.JSX.Element {
  const { theme, isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const animation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { Animated.spring(animation, { toValue: isExpanded ? 1 : 0, useNativeDriver: false, friction: 8 }).start(); }, [isExpanded, animation]);

  const containerStyle = { width: animation.interpolate({ inputRange: [0, 1], outputRange: [60, EXPANDED_WIDTH] }), height: animation.interpolate({ inputRange: [0, 1], outputRange: [60, EXPANDED_HEIGHT] }), borderRadius: animation.interpolate({ inputRange: [0, 1], outputRange: [30, 16] }) };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputText(''); setShowPresets(false); setIsLoading(true); Keyboard.dismiss();
    try {
      const response = await fetch(serverUrl + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, sqlContent: sqlContent, history: messages.map(m => ({ role: m.role, content: m.content })) }) });
      const data = await response.json();
      if (data.response) { const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response, tokens: data.usage }; setMessages(prev => [...prev, assistantMessage]); }
      else { throw new Error(data.error || 'Failed to get response'); }
    } catch (error) { const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '错误: ' + (error instanceof Error ? error.message : '未知错误') }; setMessages(prev => [...prev, errorMessage]); }
    finally { setIsLoading(false); setTimeout(() => flatListRef.current?.scrollToEnd(), 100); }
  }, [messages, sqlContent, serverUrl, isLoading]);

  const handlePresetPress = useCallback((prompt: string) => { sendMessage(prompt); }, [sendMessage]);
  const handleRefresh = useCallback(() => { setMessages([]); setShowPresets(true); }, []);

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.role === 'user' ? styles.userMessage : styles.assistantMessage]}>
      <Text style={[styles.messageText, { color: item.role === 'user' ? '#fff' : theme.text }]}>{item.content}</Text>
      {item.tokens && <Text style={[styles.tokenText, { color: theme.textSecondary }]}>Tokens: {item.tokens.totalTokens} (输入: {item.tokens.inputTokens}, 输出: {item.tokens.outputTokens})</Text>}
    </View>
  ), [theme]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }, containerStyle, isExpanded && styles.expandedContainer]}>
      {!isExpanded ? (
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => setIsExpanded(true)} activeOpacity={0.8}>
          <Text style={styles.buttonIcon}>🤖</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.expandedContent}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>SQL AI 助手</Text>
            <TouchableOpacity onPress={() => setIsExpanded(false)}><Text style={[styles.closeButton, { color: theme.primary }]}>✕</Text></TouchableOpacity>
          </View>
          {showPresets && <View style={styles.presetsContainer}>{PRESET_QUESTIONS.map(q => <TouchableOpacity key={q.id} style={[styles.presetButton, { backgroundColor: theme.primary }]} onPress={() => handlePresetPress(q.prompt)}><Text style={styles.presetText}>{q.label}</Text></TouchableOpacity>)}</View>}
          <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={(item) => item.id} style={styles.messageList} contentContainerStyle={styles.messageListContent} />
          {isLoading && <View style={styles.loadingContainer}><ActivityIndicator size="small" color={theme.primary} /><Text style={[styles.loadingText, { color: theme.textSecondary }]}>AI思考中...</Text></View>}
          <View style={styles.inputContainer}>
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} value={inputText} onChangeText={setInputText} placeholder="输入问题..." placeholderTextColor={theme.textSecondary} multiline onSubmitEditing={() => sendMessage(inputText)} />
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]} onPress={() => sendMessage(inputText)} disabled={isLoading}><Text style={styles.sendButtonText}>发送</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.refreshButton, { backgroundColor: theme.error }]} onPress={handleRefresh}><Text style={styles.refreshButtonText}>↻</Text></TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 20, right: 20, overflow: 'hidden', elevation: 10, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  expandedContainer: { padding: 12 },
  button: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  buttonIcon: { fontSize: 28 },
  expandedContent: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  closeButton: { fontSize: 18, fontWeight: '600', padding: 4 },
  presetsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  presetText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  messageList: { flex: 1 },
  messageListContent: { paddingBottom: 8 },
  messageContainer: { padding: 10, borderRadius: 8, marginBottom: 8, maxWidth: '85%' },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  assistantMessage: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0' },
  messageText: { fontSize: 14, lineHeight: 20 },
  tokenText: { fontSize: 10, marginTop: 4 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 },
  loadingText: { fontSize: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14, maxHeight: 80 },
  sendButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  sendButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  refreshButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  refreshButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AIAssistant;
