import React from 'react';
import SQLHighlighter from '../SQLHighlighter';
import { lightTheme } from '../../styles/theme';
import { render } from '@testing-library/react-native';

// Basic smoke tests to verify the component works
describe('SQLHighlighter Tests', () => {
  test('component renders without crashing', () => {
    const sql = 'SELECT * FROM users;';
    const { toJSON } = render(<SQLHighlighter sql={sql} theme={lightTheme} />);
    expect(toJSON()).toBeTruthy();
  });

  test('handles multi-line SQL', () => {
    const sql = 'SELECT * FROM users;\nSELECT * FROM orders;';
    const { getByText } = render(<SQLHighlighter sql={sql} showLineNumbers={true} />);
    
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });
});
