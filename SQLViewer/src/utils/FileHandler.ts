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