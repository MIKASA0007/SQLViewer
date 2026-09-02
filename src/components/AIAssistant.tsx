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

interface Model {
  id: string;
  name: string;
  provider: string;
  accessInfo?: {
    isRestricted: boolean;
    reason?: string;
  };
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
const EXPANDED_HEIGHT = Math.min(SCREEN_HEIGHT * 0.8, 600);
const STORAGE_KEY = 'ai_preset_questions';
const SERVER_URL_KEY = 'ai_server_url';
const DEFAULT_SERVER_URL = 'http://localhost:3001';
const MODELS_CACHE_KEY = 'ai_models_cache';
const MODELS_CACHE_TIME_KEY = 'ai_models_cache_time';
const SELECTED_MODEL_KEY = 'ai_selected_model';
const DEFAULT_MODEL = 'Pro/MiniMaxAI/MiniMax-M2.5';

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
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [modelSearch, setModelSearch] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelToast, setModelToast] = useState('');
  const [currentServerUrl, setCurrentServerUrl] = useState(serverUrl);
  const animation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestIdRef = useRef<number>(0);

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

      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 创建新的AbortController
      abortControllerRef.current = new AbortController();
      const currentRequestId = ++currentRequestIdRef.current;

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
        // 获取当前messages的快照用于history
        const currentMessages = messages;

        const requestBody = {
          message: text,
          sqlContent: sqlContent,
          history: currentMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
        };

        const response = await fetch(currentServerUrl + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        // 检查请求是否已被取消
        if (currentRequestId !== currentRequestIdRef.current) {
          return;
        }

        const data = await response.json();

        // 再次检查请求是否已被取消
        if (currentRequestId !== currentRequestIdRef.current) {
          return;
        }

        if (data.response) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            tokens: data.usage,
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error(data.error || `请求失败 (${response.status})`);
        }
      } catch (error: any) {
        // 忽略取消的错误
        if (error.name === 'AbortError' || error.name === 'CancellationError') {
          return;
        }

        let errorMsg = '未知错误';
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'object' && error !== null) {
          const errObj = error as { message?: string };
          if (errObj.message) {
            errorMsg = errObj.message;
          }
        }

        // 检查请求是否已被取消
        if (currentRequestId !== currentRequestIdRef.current) {
          return;
        }

        // 针对特定错误码给出更友好的提示
        let friendlyMessage = `错误: ${errorMsg}`;
        if (
          errorMsg.includes('30004') ||
          errorMsg.includes('私有') ||
          errorMsg.includes('private')
        ) {
          friendlyMessage =
            '⚠️ 该模型需要更高的API权限或付费访问。\n\n建议：\n1. 检查您的API密钥权限\n2. 尝试选择其他可用的模型\n3. 如需使用此模型，请联系API提供商';
        } else if (
          errorMsg.includes('401') ||
          errorMsg.includes('Unauthorized')
        ) {
          friendlyMessage = 'API密钥无效或已过期，请检查配置';
        } else if (
          errorMsg.includes('Failed to fetch') ||
          errorMsg.includes('Network')
        ) {
          friendlyMessage = `⚠️ 无法连接到AI服务器 (${currentServerUrl})\n\n请检查：\n1. 服务器是否已启动\n2. 服务器地址是否正确\n3. 手机与电脑网络是否连通`;
        }

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: friendlyMessage,
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        if (currentRequestId === currentRequestIdRef.current) {
          setIsLoading(false);
          setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        }
      }
    },
    [messages, sqlContent, currentServerUrl, selectedModel, isLoading],
  );

  const handlePresetPress = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage],
  );
  const handleRefresh = useCallback(() => {
    // 取消进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 重置请求ID
    currentRequestIdRef.current = 0;
    setMessages([]);
    setShowPresets(true);
    setIsLoading(false);
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
      {modelToast ? (
        <View style={[styles.modelToast, { backgroundColor: theme.primary }]}>
          <Text style={styles.modelToastText}>{modelToast}</Text>
        </View>
      ) : null}

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
          AI模型选择
        </Text>
        <View
          style={[
            styles.modelSelectContainer,
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
                marginBottom: 12,
              },
            ]}
            value={modelSearch}
            onChangeText={setModelSearch}
            placeholder="搜索模型..."
            placeholderTextColor={theme.textSecondary}
          />
          {loadingModels ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <FlatList
              data={models.filter(m =>
                m.name.toLowerCase().includes(modelSearch.toLowerCase()),
              )}
              keyExtractor={item => item.id}
              style={styles.modelList}
              nestedScrollEnabled={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modelItem,
                    selectedModel === item.id && {
                      backgroundColor: theme.primary + '30',
                    },
                  ]}
                  onPress={() => {
                    setSelectedModel(item.id);
                    AsyncStorage.setItem(SELECTED_MODEL_KEY, item.id);
                    setModelToast(`已切换到 ${item.name} 模型`);
                    setTimeout(() => setModelToast(''), 2000);
                  }}
                >
                  <View style={styles.modelItemContent}>
                    <View style={styles.modelNameRow}>
                      <Text
                        style={[
                          styles.modelItemName,
                          { color: theme.text },
                          selectedModel === item.id && { color: theme.primary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {item.accessInfo?.isRestricted && (
                        <Text style={styles.restrictedLabel}>受限制</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.modelItemProvider,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {item.provider}
                      {item.accessInfo?.isRestricted &&
                        ` · ${item.accessInfo.reason}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text
                  style={[styles.noModelsText, { color: theme.textSecondary }]}
                >
                  {models.length === 0
                    ? '点击"加载模型"获取模型列表'
                    : '没有匹配的模型'}
                </Text>
              }
            />
          )}
          <View style={styles.modelButtons}>
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: theme.primary }]}
              onPress={async () => {
                setLoadingModels(true);
                try {
                  const stored = await AsyncStorage.getItem(SERVER_URL_KEY);
                  const url = stored || DEFAULT_SERVER_URL;
                  const res = await fetch(url + '/api/models');
                  const data = await res.json();
                  if (data.models) {
                    // 不进行前端过滤，保留所有模型
                    setModels(data.models);
                  }
                } catch (error) {
                  Alert.alert('错误', '加载模型列表失败，请检查服务器地址');
                } finally {
                  setLoadingModels(false);
                }
              }}
            >
              <Text style={styles.formButtonText}>加载模型</Text>
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
          <Text
            style={[
              styles.currentModelText,
              { color: theme.textSecondary, marginBottom: 8 },
            ]}
          >
            当前模型: {selectedModel.split('/').pop()}
          </Text>
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
  modelToast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: 'center',
  },
  modelToastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentModelText: {
    fontSize: 11,
  },
  aboutContainer: { padding: 12, borderRadius: 8, borderWidth: 1 },
  aboutText: { fontSize: 14, fontWeight: '500' },
  aboutDesc: { fontSize: 12, marginTop: 8 },
  modelSelectContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 300,
  },
  modelList: { height: 200 },
  modelItem: { padding: 10, borderRadius: 6, marginBottom: 6 },
  modelItemContent: { flex: 1 },
  modelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modelItemName: { fontSize: 13, fontWeight: '500', flex: 1 },
  restrictedLabel: {
    fontSize: 10,
    backgroundColor: '#FF6B6B',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modelItemProvider: { fontSize: 11, marginTop: 2 },
  noModelsText: { fontSize: 12, textAlign: 'center', marginTop: 12 },
  modelButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  textArea: { minHeight: 60 },
});

export default AIAssistant;
