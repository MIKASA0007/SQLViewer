import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  NativeModules,
  Platform,
  Linking,
  DeviceEventEmitter,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UIProvider } from './src/components/ui';
import HomeScreen from './src/components/HomeScreen';
import MainScreen from './src/components/MainScreen';
import { FileHandler } from './src/utils/FileHandler';
import { FileHistoryService } from './src/services/FileHistoryService';

const Stack = createNativeStackNavigator();
const { IntentModule } = NativeModules;

function App(): React.JSX.Element {
  const navigationRef = useRef<any>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkPendingFileUri();
    }, 500);

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    const fileOpenListener = DeviceEventEmitter.addListener(
      'onOpenFile',
      event => {
        console.log('DEBUG: Received onOpenFile event:', event);
        if (event && event.uri) {
          processIncomingFile(event.uri, event.fileName);
        }
      },
    );

    return () => {
      clearTimeout(timer);
      subscription.remove();
      fileOpenListener.remove();
    };
  }, []);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log(
        'DEBUG: App state changed to active, checking for pending intents',
      );
      checkPendingFileUri();
    }
    appStateRef.current = nextAppState;
  }, []);

  const checkPendingFileUri = async () => {
    if (Platform.OS !== 'android') return;

    try {
      if (IntentModule) {
        const pendingData = await IntentModule.getPendingFileUri();
        console.log('DEBUG: Pending file data:', JSON.stringify(pendingData));

        if (pendingData && pendingData.uri) {
          await processIncomingFile(pendingData.uri, pendingData.fileName);
          await IntentModule.clearPendingFileUri();
        }
      }
    } catch (error) {
      console.error('Error checking pending file URI:', error);
    }
  };

  const processIncomingFile = useCallback(
    async (uri: string, providedFileName?: string): Promise<void> => {
      if (isProcessingFile) {
        console.log('Already processing a file, skipping...');
        return;
      }

      console.log('DEBUG: Starting to process file with URI:', uri);
      setIsProcessingFile(true);

      try {
        console.log('DEBUG: Attempting to read file from URI...');
        const content = await FileHandler.readFileFromUri(uri);
        console.log('DEBUG: File content length:', content.length);

        const fileName =
          providedFileName || uri.split('/').pop() || 'unknown.sql';
        console.log('DEBUG: Final filename to use:', fileName);

        const historyItem: any = {
          id: `${Date.now()}`,
          uri,
          name: fileName,
          size: content.length,
          type: fileName.split('.').pop() || 'sql',
          lastOpenedAt: Date.now(),
          isCopied: false,
        };

        await FileHistoryService.saveFileToHistory(historyItem);
        console.log('DEBUG: File saved to history');

        if (navigationRef.current) {
          console.log('DEBUG: Navigating to MainScreen with params:', {
            sharedUri: uri,
            fileName,
          });

          navigationRef.current.reset({
            index: 1,
            routes: [
              { name: 'Home', params: {} },
              {
                name: 'MainScreen',
                params: {
                  sharedUri: uri,
                  fileName,
                },
              },
            ],
          });
        }

        setIsProcessingFile(false);
      } catch (error) {
        setIsProcessingFile(false);

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error('Error processing incoming file:', errorMessage);

        Alert.alert('无法打开文件', `打开文件失败：${errorMessage}`);
      }
    },
    [isProcessingFile],
  );

  return (
    <UIProvider>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MainScreen"
              component={MainScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </UIProvider>
  );
}

export default App;
