export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  keywords: {
    select: string;
    from: string;
    where: string;
    join: string;
    insert: string;
    update: string;
    delete: string;
  };
}

export const lightTheme: Theme = {
  primary: '#1976d2',
  secondary: '#dc004e',
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#e0e0e0',
  keywords: {
    select: '#0000ff',
    from: '#0000ff',
    where: '#0000ff',
    join: '#0000ff',
    insert: '#0000ff',
    update: '#0000ff',
    delete: '#0000ff',
  },
};

export const darkTheme: Theme = {
  primary: '#90caf9',
  secondary: '#f48fb1',
  background: '#121212',
  surface: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#333333',
  keywords: {
    select: '#569cd6',
    from: '#569cd6',
    where: '#569cd6',
    join: '#569cd6',
    insert: '#569cd6',
    update: '#569cd6',
    delete: '#569cd6',
  },
};
