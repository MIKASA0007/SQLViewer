import { 
  searchInText, 
  searchInLines, 
  formatResults, 
  highlightMatches,
  getCurrentResultIndex,
  navigateToNextResult,
  navigateToPreviousResult
} from '../src/utils/search';

describe('search.ts', () => {
  describe('searchInText', () => {
    const sampleText = `SELECT * FROM users;
INSERT INTO orders VALUES (1, 'test');
UPDATE products SET price = 10;`;

    it('should find all occurrences of a simple query', () => {
      const results = searchInText(sampleText, 'SELECT');
      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('SELECT');
      expect(results[0].line).toBe(1);
    });

    it('should find multiple occurrences', () => {
      const results = searchInText(sampleText, 'INTO');
      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('INTO');
    });

    it('should be case insensitive by default', () => {
      const results = searchInText(sampleText, 'select');
      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('SELECT');
    });

    it('should be case sensitive when specified', () => {
      const results = searchInText(sampleText, 'select', { caseSensitive: true });
      expect(results).toHaveLength(0);
    });

    it('should match whole words only when specified', () => {
      const text = 'test testing tester';
      const results = searchInText(text, 'test', { wholeWord: true });
      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('test');
    });

    it('should support regex patterns', () => {
      const results = searchInText(sampleText, 'SELECT|INSERT', { regex: true });
      expect(results).toHaveLength(2);
    });

    it('should return empty array for empty query', () => {
      const results = searchInText(sampleText, '');
      expect(results).toHaveLength(0);
    });

    it('should return empty array for empty text', () => {
      const results = searchInText('', 'test');
      expect(results).toHaveLength(0);
    });

    it('should calculate correct line and column numbers', () => {
      const results = searchInText(sampleText, 'UPDATE');
      expect(results[0].line).toBe(3);
      expect(results[0].column).toBe(0);
    });

    it('should provide context around matches', () => {
      const results = searchInText(sampleText, 'products');
      expect(results[0].context).toContain('products');
      expect(results[0].context.length).toBeGreaterThan('products'.length);
    });
  });

  describe('searchInLines', () => {
    const sampleLines = [
      'SELECT * FROM users;',
      'INSERT INTO orders VALUES (1, "test");',
      'UPDATE products SET price = 10;',
    ];

    it('should search across multiple lines', () => {
      const results = searchInLines(sampleLines, 'FROM');
      expect(results).toHaveLength(1);
      expect(results[0].lineNumber).toBe(1);
    });

    it('should find matches on different lines', () => {
      const results = searchInLines(sampleLines, ';');
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.lineNumber).toBe(index + 1);
      });
    });

    it('should include line number in results', () => {
      const results = searchInLines(sampleLines, 'INSERT');
      expect(results[0].lineNumber).toBe(2);
    });
  });

  describe('formatResults', () => {
    it('should format "no matches" correctly', () => {
      expect(formatResults([])).toBe('No matches found');
    });

    it('should format single match correctly', () => {
      const results = [{ start: 0, end: 4, line: 1, column: 0, text: 'test', context: 'test' }];
      expect(formatResults(results)).toBe('1 match found');
    });

    it('should format multiple matches correctly', () => {
      const results = [
        { start: 0, end: 4, line: 1, column: 0, text: 'test', context: 'test' },
        { start: 10, end: 14, line: 1, column: 10, text: 'test', context: 'test' },
      ];
      expect(formatResults(results)).toBe('2 matches found');
    });
  });

  describe('highlightMatches', () => {
    it('should highlight matches with span tags', () => {
      const text = 'SELECT * FROM users';
      const results = [{ start: 0, end: 6, line: 1, column: 0, text: 'SELECT', context: text }];
      const highlighted = highlightMatches(text, results);
      expect(highlighted).toContain('<span class="search-highlight">SELECT</span>');
    });

    it('should highlight multiple matches', () => {
      const text = 'test test test';
      const results = [
        { start: 0, end: 4, line: 1, column: 0, text: 'test', context: text },
        { start: 5, end: 9, line: 1, column: 5, text: 'test', context: text },
        { start: 10, end: 14, line: 1, column: 10, text: 'test', context: text },
      ];
      const highlighted = highlightMatches(text, results);
      const matches = highlighted.match(/<span class="search-highlight">test<\/span>/g);
      expect(matches).toHaveLength(3);
    });

    it('should return original text when no results', () => {
      const text = 'SELECT * FROM users';
      const highlighted = highlightMatches(text, []);
      expect(highlighted).toBe(text);
    });

    it('should use custom highlight class when provided', () => {
      const text = 'SELECT * FROM users';
      const results = [{ start: 0, end: 6, line: 1, column: 0, text: 'SELECT', context: text }];
      const highlighted = highlightMatches(text, results, 'custom-highlight');
      expect(highlighted).toContain('<span class="custom-highlight">SELECT</span>');
    });
  });

  describe('navigation functions', () => {
    const sampleText = 'one two three four five';
    const results = searchInText(sampleText, '\\w+', { regex: true });

    describe('getCurrentResultIndex', () => {
      it('should find current result index', () => {
        const index = getCurrentResultIndex(results, 4);
        expect(index).toBe(1);
      });

      it('should return -1 when not in any result', () => {
        const index = getCurrentResultIndex(results, 100);
        expect(index).toBe(-1);
      });
    });

    describe('navigateToNextResult', () => {
      it('should navigate to first result when no current position', () => {
        const { result, index } = navigateToNextResult(results, -1);
        expect(index).toBe(0);
        expect(result).toBe(results[0]);
      });

      it('should navigate to next result', () => {
        const currentPos = results[0].start;
        const { result, index } = navigateToNextResult(results, currentPos);
        expect(index).toBe(1);
        expect(result).toBe(results[1]);
      });

      it('should wrap around to first result at end', () => {
        const currentPos = results[results.length - 1].start;
        const { result, index } = navigateToNextResult(results, currentPos);
        expect(index).toBe(0);
        expect(result).toBe(results[0]);
      });
    });

    describe('navigateToPreviousResult', () => {
      it('should navigate to last result when no current position', () => {
        const { result, index } = navigateToPreviousResult(results, -1);
        expect(index).toBe(results.length - 1);
        expect(result).toBe(results[results.length - 1]);
      });

      it('should navigate to previous result', () => {
        const currentPos = results[1].start;
        const { result, index } = navigateToPreviousResult(results, currentPos);
        expect(index).toBe(0);
        expect(result).toBe(results[0]);
      });

      it('should wrap around to last result at beginning', () => {
        const currentPos = results[0].start;
        const { result, index } = navigateToPreviousResult(results, currentPos);
        expect(index).toBe(results.length - 1);
        expect(result).toBe(results[results.length - 1]);
      });
    });
  });
});