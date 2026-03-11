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