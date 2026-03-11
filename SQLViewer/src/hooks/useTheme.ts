/**
 * @format
 */

import {useState, useEffect} from 'react';

export interface Theme {
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  error: string;
}

const lightTheme: Theme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#DDDDDD',
  text: '#000000',
  textSecondary: '#888888',
  primary: '#007AFF',
  error: '#FF0000',
};

const darkTheme: Theme = {
  background: '#000000',
  surface: '#1C1C1E',
  border: '#38383A',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  primary: '#0A84FF',
  error: '#FF453A',
};

function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return {
    theme: isDarkMode ? darkTheme : lightTheme,
    isDarkMode,
    setIsDarkMode,
  };
}

export default useTheme;
