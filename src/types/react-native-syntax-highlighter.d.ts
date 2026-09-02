declare module 'react-native-syntax-highlighter' {
  import React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface SyntaxHighlighterProps {
    language: string;
    style: any;
    customStyle?: StyleProp<ViewStyle>;
    children: string;
    wrapLines?: boolean;
  }

  export default class SyntaxHighlighter extends React.Component<SyntaxHighlighterProps> {}
}

declare module 'react-syntax-highlighter/styles/prism' {
  export const docco: any;
  export const dark: any;
  export const light: any;
}
