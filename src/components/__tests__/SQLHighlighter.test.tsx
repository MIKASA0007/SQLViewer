import React from 'react';
import { render } from '@testing-library/react-native';
import SQLHighlighter from '../SQLHighlighter';
import { lightTheme } from '../../styles/theme';

describe('SQLHighlighter', () => {
  it('should render SQL with syntax highlighting', () => {
    const sql = 'SELECT * FROM users WHERE id = 1;';
    const { getByText } = render(<SQLHighlighter sql={sql} theme={lightTheme} />);
    
    expect(getByText('SELECT')).toBeTruthy();
    expect(getByText('FROM')).toBeTruthy();
    expect(getByText('WHERE')).toBeTruthy();
  });

  it('should show line numbers when enabled', () => {
    const sql = 'SELECT 1;\nSELECT 2;';
    const { getByText } = render(<SQLHighlighter sql={sql} showLineNumbers={true} />);
    
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('should not show line numbers when disabled', () => {
    const sql = 'SELECT 1;\nSELECT 2;';
    const { queryByText } = render(<SQLHighlighter sql={sql} showLineNumbers={false} />);
    
    expect(queryByText('1')).toBeFalsy();
    expect(queryByText('2')).toBeFalsy();
  });

  it('should apply custom font size', () => {
    const sql = 'SELECT * FROM users;';
    const { getByText } = render(<SQLHighlighter sql={sql} fontSize={18} />);
    const textElement = getByText('SELECT');
    
    expect(textElement.props.style.fontSize).toBe(18);
  });

  it('should apply theme colors', () => {
    const sql = 'SELECT * FROM users;';
    const { getByText } = render(<SQLHighlighter sql={sql} theme={lightTheme} />);
    const container = getByText('SELECT').parent?.parent?.parent;
    
    expect(container?.props.style.backgroundColor).toBe(lightTheme.background);
  });
});
