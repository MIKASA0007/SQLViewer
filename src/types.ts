export type DisplayMode = 'code' | 'table';

export interface SQLTable {
  name: string;
  columns: Column[];
  rows?: string[][];
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
}

export interface SQLStatement {
  type: 'CREATE_TABLE' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DROP' | 'ALTER' | 'OTHER';
  original: string;
  table?: SQLTable;
}

export interface FileData {
  uri: string;
  name: string;
  content: string;
  statements: SQLStatement[];
}

export interface FileHistoryItem {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: string;
  lastOpenedAt: number;
  isCopied?: boolean;
  copiedPath?: string;
  sourceApp?: string;
}
