interface SearchResult {
  start: number;
  end: number;
  line: number;
  column: number;
  text: string;
  context: string;
}

interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLineAndColumn(text: string, index: number): { line: number; column: number } {
  const lines = text.substring(0, index).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length;
  return { line, column };
}

function getContext(text: string, start: number, end: number, contextLength: number = 50): string {
  const before = text.substring(Math.max(0, start - contextLength), start);
  const match = text.substring(start, end);
  const after = text.substring(end, Math.min(text.length, end + contextLength));
  return `${before}${match}${after}`;
}

export function searchInText(
  text: string,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  if (!query || !text) {
    return [];
  }

  const { caseSensitive = false, wholeWord = false, regex = false } = options;

  let pattern: RegExp;

  if (regex) {
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      pattern = new RegExp(query, flags);
    } catch (e) {
      return [];
    }
  } else {
    let escapedQuery = escapeRegExp(query);
    
    if (wholeWord) {
      escapedQuery = `\\b${escapedQuery}\\b`;
    }
    
    const flags = caseSensitive ? 'g' : 'gi';
    pattern = new RegExp(escapedQuery, flags);
  }

  const results: SearchResult[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;
    const { line, column } = getLineAndColumn(text, start);
    
    results.push({
      start,
      end,
      line,
      column,
      text: match[0],
      context: getContext(text, start, end),
    });

    if (match[0].length === 0) {
      pattern.lastIndex++;
    }
  }

  return results;
}

export function searchInLines(
  lines: string[],
  query: string,
  options: SearchOptions = {}
): Array<SearchResult & { lineNumber: number }> {
  const results: Array<SearchResult & { lineNumber: number }> = [];
  
  lines.forEach((line, lineIndex) => {
    const lineResults = searchInText(line, query, options);
    lineResults.forEach(result => {
      results.push({
        ...result,
        lineNumber: lineIndex + 1,
      });
    });
  });
  
  return results;
}

export function highlightMatches(
  text: string,
  results: SearchResult[],
  highlightClass: string = 'search-highlight'
): string {
  if (!results.length) {
    return text;
  }

  const sortedResults = [...results].sort((a, b) => b.start - a.start);
  let highlightedText = text;

  sortedResults.forEach(result => {
    const before = highlightedText.substring(0, result.start);
    const match = highlightedText.substring(result.start, result.end);
    const after = highlightedText.substring(result.end);
    highlightedText = `${before}<span class="${highlightClass}">${match}</span>${after}`;
  });

  return highlightedText;
}

export function formatResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No matches found';
  }
  
  if (results.length === 1) {
    return '1 match found';
  }
  
  return `${results.length} matches found`;
}

export function getCurrentResultIndex(results: SearchResult[], currentPosition: number): number {
  if (!results.length) {
    return -1;
  }
  
  return results.findIndex(result => 
    currentPosition >= result.start && currentPosition <= result.end
  );
}

export function navigateToNextResult(
  results: SearchResult[],
  currentPosition: number
): { result: SearchResult | null; index: number } {
  if (!results.length) {
    return { result: null, index: -1 };
  }

  const currentIndex = getCurrentResultIndex(results, currentPosition);
  
  if (currentIndex === -1) {
    const nextIndex = results.findIndex(result => result.start > currentPosition);
    return nextIndex !== -1 
      ? { result: results[nextIndex], index: nextIndex }
      : { result: results[0], index: 0 };
  }
  
  const nextIndex = (currentIndex + 1) % results.length;
  return { result: results[nextIndex], index: nextIndex };
}

export function navigateToPreviousResult(
  results: SearchResult[],
  currentPosition: number
): { result: SearchResult | null; index: number } {
  if (!results.length) {
    return { result: null, index: -1 };
  }

  const currentIndex = getCurrentResultIndex(results, currentPosition);
  
  if (currentIndex === -1) {
    const prevIndex = results.reverse().findIndex(result => result.end < currentPosition);
    return prevIndex !== -1 
      ? { result: results[prevIndex], index: results.length - 1 - prevIndex }
      : { result: results[results.length - 1], index: results.length - 1 };
  }
  
  const prevIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
  return { result: results[prevIndex], index: prevIndex };
}

export type { SearchResult, SearchOptions };