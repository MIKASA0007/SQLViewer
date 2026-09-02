import RNFS from 'react-native-fs';
import { NativeModules, Platform } from 'react-native';

const { IntentModule } = NativeModules;

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
      const content = await this.readFileFromUri(uri);
      const fileName = uri.split('/').pop() || 'unknown.sql';

      return {
        uri,
        name: fileName,
        content,
        size: content.length,
      };
    } catch (error) {
      console.error('Error handling shared file:', error);
      return null;
    }
  }

  static async readFileFromUri(uri: string): Promise<string> {
    // 如果是 Android 的 content:// URI，直接用原生方法读取
    if (Platform.OS === 'android' && uri.startsWith('content://')) {
      console.log('DEBUG: Reading content:// URI with native method');
      try {
        if (IntentModule && IntentModule.readContentUri) {
          const content = await IntentModule.readContentUri(uri);
          console.log('DEBUG: Successfully read content URI, length:', content?.length);
          return content;
        }
      } catch (error) {
        console.error('Error reading content URI with native method:', error);
        throw error;
      }
    }
    
    // 其他情况用 RNFS 读取
    try {
      return await RNFS.readFile(uri, 'utf8');
    } catch (error) {
      console.error('Error reading file with RNFS:', error);
      throw error;
    }
  }
}