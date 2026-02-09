import { renderHook, act } from '@testing-library/react-hooks';
import { useSearch } from '../src/hooks/useSearch';

describe('useSearch', () => {
  const sampleText = `SELECT * FROM users;
INSERT INTO orders VALUES (1, 'test');
UPDATE products SET price = 10;`;

  describe('initial state', () => {
    it('should initialize with empty query and results', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      expect(result.current.query).toBe('');
      expect(result.current.results).toEqual([]);
      expect(result.current.totalResults).toBe(0);
      expect(result.current.currentResultIndex).toBe(-1);
      expect(result.current.currentResult).toBeNull();
    });

    it('should initialize with provided initial query', () => {
      const { result } = renderHook(() => useSearch({ 
        text: sampleText, 
        initialQuery: 'SELECT' 
      }));

      expect(result.current.query).toBe('SELECT');
    });
  });

  describe('search functionality', () => {
    it('should perform search when search is called', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('SELECT');
      });

      act(() => {
        result.current.search();
      });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].text).toBe('SELECT');
      expect(result.current.totalResults).toBe(1);
      expect(result.current.currentResultIndex).toBe(0);
    });

    it('should update results when query changes and search is called', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('FROM');
        result.current.search();
      });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].text).toBe('FROM');
    });

    it('should return empty results for empty query', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('');
        result.current.search();
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.totalResults).toBe(0);
    });

    it('should respect search options', () => {
      const { result } = renderHook(() => useSearch({ 
        text: sampleText,
        options: { caseSensitive: true }
      }));

      act(() => {
        result.current.setQuery('select');
        result.current.search();
      });

      expect(result.current.results).toHaveLength(0);
    });
    
    it('should search in lines when lines prop is provided', () => {
      const lines = sampleText.split('\n');
      const { result } = renderHook(() => useSearch({ lines }));

      act(() => {
        result.current.setQuery('INSERT');
        result.current.search();
      });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].text).toBe('INSERT');
    });
  });

  describe('clear functionality', () => {
    it('should clear query and results', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('SELECT');
        result.current.search();
      });

      expect(result.current.results).toHaveLength(1);

      act(() => {
        result.current.clear();
      });

      expect(result.current.query).toBe('');
      expect(result.current.results).toEqual([]);
      expect(result.current.currentResultIndex).toBe(-1);
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should navigate to next result', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('\\b\\w+\\b');
        result.current.setOptions({ regex: true });
        result.current.search();
      });

      const firstIndex = result.current.currentResultIndex;

      act(() => {
        result.current.nextResult();
      });

      expect(result.current.currentResultIndex).toBe(firstIndex + 1);
    });

    it('should navigate to previous result', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('\\b\\w+\\b');
        result.current.setOptions({ regex: true });
        result.current.search();
      });

      const lastIndex = result.current.results.length - 1;

      act(() => {
        result.current.goToResult(lastIndex);
        result.current.previousResult();
      });

      expect(result.current.currentResultIndex).toBe(lastIndex - 1);
    });

    it('should wrap around when navigating past last result', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('\\b\\w+\\b');
        result.current.setOptions({ regex: true });
        result.current.search();
      });

      const lastIndex = result.current.results.length - 1;

      act(() => {
        result.current.goToResult(lastIndex);
        result.current.nextResult();
      });

      expect(result.current.currentResultIndex).toBe(0);
    });

    it('should wrap around when navigating before first result', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('\\b\\w+\\b');
        result.current.setOptions({ regex: true });
        result.current.search();
      });

      act(() => {
        result.current.goToResult(0);
        result.current.previousResult();
      });

      const lastIndex = result.current.results.length - 1;
      expect(result.current.currentResultIndex).toBe(lastIndex);
    });

    it('should go to specific result index', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('\\b\\w+\\b');
        result.current.setOptions({ regex: true });
        result.current.search();
      });

      act(() => {
        result.current.goToResult(3);
      });

      expect(result.current.currentResultIndex).toBe(3);
      expect(result.current.currentResult).toBe(result.current.results[3]);
    });
  });

  describe('results text formatting', () => {
    it('should format results text correctly', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('SELECT');
        result.current.search();
      });

      expect(result.current.resultsText).toBe('1 match found');
    });

    it('should update results text when results change', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('\\b\\w+\\b');
        result.current.setOptions({ regex: true });
        result.current.search();
      });

      expect(result.current.resultsText).toMatch(/\d+ matches found/);
    });
  });

  describe('callback', () => {
    it('should call onResultSelect when search finds results', () => {
      const onResultSelect = jest.fn();
      const { result } = renderHook(() => useSearch({ 
        text: sampleText,
        onResultSelect 
      }));

      act(() => {
        result.current.setQuery('SELECT');
        result.current.search();
      });

      expect(onResultSelect).toHaveBeenCalledTimes(1);
      expect(onResultSelect).toHaveBeenCalledWith(result.current.results[0]);
    });

    it('should call onResultSelect when navigating results', () => {
      const onResultSelect = jest.fn();
      const { result } = renderHook(() => useSearch({ 
        text: sampleText,
        onResultSelect 
      }));

      act(() => {
        result.current.setQuery('\\b\\w+\\b');
        result.current.setOptions({ regex: true });
        result.current.search();
      });

      const callCountAfterSearch = onResultSelect.mock.calls.length;

      act(() => {
        result.current.nextResult();
      });

      expect(onResultSelect).toHaveBeenCalledTimes(callCountAfterSearch + 1);
    });
  });

  describe('options management', () => {
    it('should update options', () => {
      const { result } = renderHook(() => useSearch({ 
        text: sampleText,
        options: { caseSensitive: false }
      }));

      expect(result.current.options.caseSensitive).toBe(false);

      act(() => {
        result.current.setOptions({ caseSensitive: true, wholeWord: true });
      });

      expect(result.current.options.caseSensitive).toBe(true);
      expect(result.current.options.wholeWord).toBe(true);
    });

    it('should use new options for subsequent searches', () => {
      const { result } = renderHook(() => useSearch({ text: sampleText }));

      act(() => {
        result.current.setQuery('insert');
        result.current.search();
      });

      expect(result.current.totalResults).toBeGreaterThan(0);

      act(() => {
        result.current.setOptions({ caseSensitive: true });
        result.current.search();
      });

      expect(result.current.totalResults).toBe(0);
    });
  });
});