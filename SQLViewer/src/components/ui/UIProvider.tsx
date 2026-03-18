import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import useTheme from '../../hooks/useTheme';

interface UIProviderProps {
  children: React.ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const { isDarkMode } = useTheme();

  return (
    <GluestackUIProvider colorMode={isDarkMode ? 'dark' : 'light'}>
      {children}
    </GluestackUIProvider>
  );
}
