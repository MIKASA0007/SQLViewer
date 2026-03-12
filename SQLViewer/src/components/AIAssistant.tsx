import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useTheme from '../hooks/useTheme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens?: { inputTokens: number; outputTokens: number; totalTokens: number };
}

interface PresetQuestion {
  id: string;
  label: string;
  prompt: string;
}

interface AIAssistantProps {
  sqlContent?: string;
  serverUrl?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const EXPANDED_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 400);
const EXPANDED_HEIGHT = Math.min(SCREEN_HEIGHT * 0.6, 500);
const STORAGE_KEY = 'ai_preset_questions';
const SERVER_URL_KEY = 'ai_server_url';
const DEFAULT_SERVER_URL = 'http://localhost:3001';

const DEFAULT_PRESETS: PresetQuestion[] = [
  {
    id: '1',
    label: '分析SQL健壮性',
    prompt: '请分析这个SQL语句的健壮性，包括可能的数据类型问题、边界条件处理等',
  },
  {
    id: '2',
    label: '查找潜在bug',
    prompt: '请查找这个SQL语句中可能存在的bug或逻辑错误',
  },
  { id: '3', label: '性能优化建议', prompt: '请给出这个SQL语句的性能优化建议' },
  {
    id: '4',
    label: '安全漏洞检查',
    prompt: '请检查这个SQL语句是否存在安全漏洞，如SQL注入风险',
  },
];

function AIAssistant({
  sqlContent = '',
  serverUrl = 'http://localhost:3001',
}: AIAssistantProps): React.JSX.Element {
  const { theme, isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const [presets, setPresets] = useState<PresetQuestion[]>([]);
  const [editingPreset, setEditingPreset] = useState<PresetQuestion | null>(
    null,
  );
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetPrompt, setNewPresetPrompt] = useState('');
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [currentServerUrl, setCurrentServerUrl] = useState(serverUrl);
  const animation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Animated.spring(animation, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [isExpanded, animation]);

  useEffect(() => {
    loadPresets();
    loadServerUrl();
  }, []);

  const loadPresets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      } else {
        setPresets(DEFAULT_PRESETS);
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(DEFAULT_PRESETS),
        );
      }
    } catch (error) {
      setPresets(DEFAULT_PRESETS);
    }
  };

  const loadServerUrl = async () => {
    try {
      const stored = await AsyncStorage.getItem(SERVER_URL_KEY);
      if (stored) {
        setServerUrlInput(stored);
        setCurrentServerUrl(stored);
      } else {
        setServerUrlInput(serverUrl || DEFAULT_SERVER_URL);
        setCurrentServerUrl(serverUrl || DEFAULT_SERVER_URL);
      }
    } catch (error) {
      setServerUrlInput(serverUrl || DEFAULT_SERVER_URL);
      setCurrentServerUrl(serverUrl || DEFAULT_SERVER_URL);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!serverUrlInput.trim()) {
      Alert.alert('提示', '请输入服务器地址');
      return;
    }
    try {
      await AsyncStorage.setItem(SERVER_URL_KEY, serverUrlInput.trim());
      setCurrentServerUrl(serverUrlInput.trim());
      Alert.alert('成功', '服务器地址已保存');
    } catch (error) {
      Alert.alert('错误', '保存服务器地址失败');
    }
  };

  const handleResetServerUrl = async () => {
    try {
      await AsyncStorage.removeItem(SERVER_URL_KEY);
      const defaultUrl = DEFAULT_SERVER_URL;
      setServerUrlInput(defaultUrl);
      setCurrentServerUrl(defaultUrl);
      Alert.alert('成功', '已重置为默认地址');
    } catch (error) {
      Alert.alert('错误', '重置失败');
    }
  };

  const savePresets = async (newPresets: PresetQuestion[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
      setPresets(newPresets);
    } catch (error) {
      Alert.alert('错误', '保存预设失败');
    }
  };

  const handleAddPreset = () => {
    if (!newPresetLabel.trim() || !newPresetPrompt.trim()) {
      Alert.alert('提示', '请输入标签和提示词');
      return;
    }
    const newPreset: PresetQuestion = {
      id: Date.now().toString(),
      label: newPresetLabel.trim(),
      prompt: newPresetPrompt.trim(),
    };
    savePresets([...presets, newPreset]);
    setNewPresetLabel('');
    setNewPresetPrompt('');
    Alert.alert('成功', '预设已添加');
  };

  const handleEditPreset = () => {
    if (!editingPreset || !newPresetLabel.trim() || !newPresetPrompt.trim()) {
      Alert.alert('提示', '请输入标签和提示词');
      return;
    }
    const updated = presets.map(p =>
      p.id === editingPreset.id
        ? { ...p, label: newPresetLabel.trim(), prompt: newPresetPrompt.trim() }
        : p,
    );
    savePresets(updated);
    setEditingPreset(null);
    setNewPresetLabel('');
    setNewPresetPrompt('');
    Alert.alert('成功', '预设已更新');
  };

  const handleDeletePreset = (id: string) => {
    Alert.alert('确认删除', '确定要删除这个预设吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => savePresets(presets.filter(p => p.id !== id)),
      },
    ]);
  };

  const handleResetPresets = () => {
    Alert.alert('恢复默认', '确定要恢复默认预设吗？这将删除所有自定义预设。', [
      { text: '取消', style: 'cancel' },
      { text: '恢复', onPress: () => savePresets(DEFAULT_PRESETS) },
    ]);
  };

  const containerStyle = {
    width: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [60, EXPANDED_WIDTH],
    }),
    height: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [60, EXPANDED_HEIGHT],
    }),
    borderRadius: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 16],
    }),
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
      };
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setShowPresets(false);
      setIsLoading(true);
      Keyboard.dismiss();
      try {
        const response = await fetch(currentServerUrl + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            sqlContent: sqlContent,
            history: messages.map(m => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await response.json();
        if (data.response) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            tokens: data.usage,
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error(data.error || 'Failed to get response');
        }
      } catch (error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            '错误: ' + (error instanceof Error ? error.message : '未知错误'),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      }
    },
    [messages, sqlContent, serverUrl, isLoading],
  );

  const handlePresetPress = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage],
  );
  const handleRefresh = useCallback(() => {
    setMessages([]);
    setShowPresets(true);
  }, []);
  const handleClearChat = () => {
    Alert.alert('清空聊天', '确定要清空所有聊天记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: () => {
          setMessages([]);
          setShowPresets(true);
        },
      },
    ]);
  };

  const openEditPreset = (preset: PresetQuestion) => {
    setEditingPreset(preset);
    setNewPresetLabel(preset.label);
    setNewPresetPrompt(preset.prompt);
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <View
        style={[
          styles.messageContainer,
          item.role === 'user' ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: item.role === 'user' ? '#fff' : theme.text },
          ]}
        >
          {item.content}
        </Text>
        {item.tokens && (
          <Text style={[styles.tokenText, { color: theme.textSecondary }]}>
            Tokens: {item.tokens.totalTokens} (输入: {item.tokens.inputTokens},
            输出: {item.tokens.outputTokens})
          </Text>
        )}
      </View>
    ),
    [theme],
  );

  const renderSettingsContent = () => (
    <View style={styles.settingsContainer}>
      <View style={styles.settingsHeader}>
        <Text style={[styles.settingsTitle, { color: theme.text }]}>设置</Text>
        <TouchableOpacity onPress={() => setShowSettings(false)}>
          <Text style={[styles.settingsClose, { color: theme.primary }]}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.settingsContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          服务器地址
        </Text>
        <View
          style={[
            styles.serverUrlContainer,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={serverUrlInput}
            onChangeText={setServerUrlInput}
            placeholder="例如: http://192.168.1.100:3001"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="url"
          />
          <View style={styles.serverUrlButtons}>
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveServerUrl}
            >
              <Text style={styles.formButtonText}>保存</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.formButton,
                { backgroundColor: theme.textSecondary },
              ]}
              onPress={handleResetServerUrl}
            >
              <Text style={styles.formButtonText}>重置</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          预设提示词管理
        </Text>
        {presets.map(preset => (
          <View
            key={preset.id}
            style={[
              styles.presetItem,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <View style={styles.presetInfo}>
              <Text style={[styles.presetLabel, { color: theme.text }]}>
                {preset.label}
              </Text>
              <Text
                style={[styles.presetPrompt, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {preset.prompt}
              </Text>
            </View>
            <View style={styles.presetActions}>
              <TouchableOpacity
                onPress={() => openEditPreset(preset)}
                style={styles.presetActionBtn}
              >
                <Text
                  style={[styles.presetActionText, { color: theme.primary }]}
                >
                  编辑
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeletePreset(preset.id)}
                style={styles.presetActionBtn}
              >
                <Text style={[styles.presetActionText, { color: theme.error }]}>
                  删除
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View
          style={[
            styles.addPresetForm,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.formTitle, { color: theme.text }]}>
            {editingPreset ? '编辑预设' : '添加新预设'}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={newPresetLabel}
            onChangeText={setNewPresetLabel}
            placeholder="标签名称"
            placeholderTextColor={theme.textSecondary}
          />
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={newPresetPrompt}
            onChangeText={setNewPresetPrompt}
            placeholder="提示词内容"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
          />
          <View style={styles.formButtons}>
            {editingPreset && (
              <TouchableOpacity
                style={[
                  styles.formButton,
                  { backgroundColor: theme.textSecondary },
                ]}
                onPress={() => {
                  setEditingPreset(null);
                  setNewPresetLabel('');
                  setNewPresetPrompt('');
                }}
              >
                <Text style={styles.formButtonText}>取消</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: theme.primary }]}
              onPress={editingPreset ? handleEditPreset : handleAddPreset}
            >
              <Text style={styles.formButtonText}>
                {editingPreset ? '保存' : '添加'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.textSecondary },
          ]}
          onPress={handleResetPresets}
        >
          <Text style={styles.actionButtonText}>恢复默认预设</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          聊天管理
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.error }]}
          onPress={handleClearChat}
        >
          <Text style={styles.actionButtonText}>清空聊天记录</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>关于</Text>
        <View
          style={[
            styles.aboutContainer,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.aboutText, { color: theme.text }]}>
            SQL AI 助手
          </Text>
          <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
            版本 1.0.0
          </Text>
          <Text style={[styles.aboutDesc, { color: theme.textSecondary }]}>
            智能SQL分析工具，帮助您分析、优化和安全检查SQL语句。
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' },
        containerStyle,
        isExpanded && styles.expandedContainer,
      ]}
    >
      {!isExpanded ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>🤖</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.expandedContent}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              SQL AI 助手
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setShowSettings(true)}
                style={styles.headerBtn}
              >
                <Text style={[styles.headerBtnText, { color: theme.primary }]}>
                  ⚙️
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsExpanded(false)}>
                <Text style={[styles.closeButton, { color: theme.primary }]}>
                  −
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {showPresets && (
            <View style={styles.presetsContainer}>
              {presets.map(q => (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.presetButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => handlePresetPress(q.prompt)}
                >
                  <Text style={styles.presetText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
          />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                AI思考中...
              </Text>
            </View>
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="输入问题..."
              placeholderTextColor={theme.textSecondary}
              multiline
              onSubmitEditing={() => sendMessage(inputText)}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.primary }]}
              onPress={() => sendMessage(inputText)}
              disabled={isLoading}
            >
              <Text style={styles.sendButtonText}>发送</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: theme.error }]}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' },
            ]}
          >
            {renderSettingsContent()}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    overflow: 'hidden',
    elevation: 10,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  expandedContainer: { padding: 12 },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: { fontSize: 28 },
  expandedContent: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { padding: 4, marginRight: 8 },
  headerBtnText: { fontSize: 18 },
  closeButton: { fontSize: 24, fontWeight: '600', padding: 4 },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  presetText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  messageList: { flex: 1 },
  messageListContent: { paddingBottom: 8 },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '85%',
  },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  assistantMessage: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0' },
  messageText: { fontSize: 14, lineHeight: 20 },
  tokenText: { fontSize: 10, marginTop: 4 },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  loadingText: { fontSize: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  sendButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  refreshButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  refreshButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeButton: { fontSize: 22, fontWeight: '600', padding: 4 },
  headerBtn: { marginRight: 12 },
  headerBtnText: { fontSize: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: EXPANDED_WIDTH,
    height: EXPANDED_HEIGHT,
    borderRadius: 16,
    padding: 16,
  },
  settingsContainer: { flex: 1 },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsTitle: { fontSize: 18, fontWeight: '600' },
  settingsClose: { fontSize: 18, fontWeight: '600', padding: 4 },
  settingsContent: { flex: 1 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  presetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  presetInfo: { flex: 1, marginRight: 8 },
  presetLabel: { fontSize: 14, fontWeight: '500' },
  presetPrompt: { fontSize: 12, marginTop: 4 },
  presetActions: { flexDirection: 'row', gap: 8 },
  presetActionBtn: { padding: 4 },
  presetActionText: { fontSize: 12, fontWeight: '500' },
  addPresetForm: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  formTitle: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  formButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  formButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 16 },
  serverUrlContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  serverUrlButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  aboutContainer: { padding: 12, borderRadius: 8, borderWidth: 1 },
  aboutText: { fontSize: 14, fontWeight: '500' },
  aboutDesc: { fontSize: 12, marginTop: 8 },
});

export default AIAssistant;
