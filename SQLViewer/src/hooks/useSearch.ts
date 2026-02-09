import { useState, useCallback, useMemo } from 'react';
import {
  searchInText,
  searchInLines,
  formatResults,
  navigateToNextResult,
  navigateToPreviousResult,
  getCurrentResultIndex,
  SearchResult,
  SearchOptions,
} from '../utils/search';

interface UseSearchProps {
  text?: string;
  lines?: string[];
  initialQuery?: string;
  options?: SearchOptions;
  onResultSelect?: (result: SearchResult) => void;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  currentResultIndex: number;
  totalResults: number;
  resultsText: string;
  isSearching: boolean;
  options: SearchOptions;
  setOptions: (options: SearchOptions) => void;
  search: () => void;
  clear: () => void;
  nextResult: () => SearchResult | null;
  previousResult: () => SearchResult | null;
  goToResult: (index: number) => void;
  currentResult: SearchResult | null;
}

export function useSearch({
  text,
  lines,
  initialQuery = '',
  options: initialOptions = {},
  onResultSelect,
}: UseSearchProps): UseSearchReturn {
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [options, setOptions] = useState<SearchOptions>(initialOptions);

  const totalResults = results.length;
  const currentResult = currentResultIndex >= 0 ? results[currentResultIndex] : null;

  const resultsText = useMemo(() => formatResults(results), [results]);

  const search = useCallback(() => {
    if (!query || (!text && !lines)) {
      setResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    setIsSearching(true);

    try {
      let searchResults: SearchResult[] = [];

      if (lines) {
        searchResults = searchInLines(lines, query, options).map(result => ({
          start: result.start,
          end: result.end,
          line: result.line,
          column: result.column,
          text: result.text,
          context: result.context,
        }));
      } else if (text) {
        searchResults = searchInText(text, query, options);
      }

      setResults(searchResults);
      
      if (searchResults.length > 0) {
        setCurrentResultIndex(0);
        onResultSelect?.(searchResults[0]);
      } else {
        setCurrentResultIndex(-1);
      }
    } finally {
      setIsSearching(false);
    }
  }, [query, text, lines, options, onResultSelect]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setCurrentResultIndex(-1);
  }, []);

  const nextResult = useCallback((): SearchResult | null => {
    if (!results.length) return null;

    const currentPosition = currentResult?.start ?? -1;
    const { result, index } = navigateToNextResult(results, currentPosition);
    
    if (result) {
      setCurrentResultIndex(index);
      onResultSelect?.(result);
    }
    
    return result;
  }, [results, currentResult, onResultSelect]);

  const previousResult = useCallback((): SearchResult | null => {
    if (!results.length) return null;

    const currentPosition = currentResult?.start ?? -1;
    const { result, index } = navigateToPreviousResult(results, currentPosition);
    
    if (result) {
      setCurrentResultIndex(index);
      onResultSelect?.(result);
    }
    
    return result;
  }, [results, currentResult, onResultSelect]);

  const goToResult = useCallback((index: number) => {
    if (index >= 0 && index < results.length) {
      setCurrentResultIndex(index);
      onResultSelect?.(results[index]);
    }
  }, [results, onResultSelect]);

  return {
    query,
    setQuery,
    results,
    currentResultIndex,
    totalResults,
    resultsText,
    isSearching,
    options,
    setOptions,
    search,
    clear,
    nextResult,
    previousResult,
    goToResult,
    currentResult,
  };
}