import React, { useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  resultsText?: string;
  currentResultIndex?: number;
  totalResults?: number;
  placeholder?: string;
  showNavigation?: boolean;
  showResultsCount?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  onClear,
  onNext,
  onPrevious,
  resultsText,
  currentResultIndex = -1,
  totalResults = 0,
  placeholder = 'Search...',
  showNavigation = true,
  showResultsCount = true,
  autoFocus = false,
  onSubmitEditing,
}) => {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [autoFocus]);

  const handleQueryChange = (text: string) => {
    onQueryChange(text);
  };

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  const handleSubmitEditing = () => {
    onSearch();
    onSubmitEditing?.();
  };

  const hasResults = totalResults > 0;
  const showClearButton = query.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={handleSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor="#8E8E93"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectTextOnFocus
            clearButtonMode="while-editing"
          />
          {showClearButton && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          onPress={onSearch}
          style={[styles.searchButton, query.length === 0 && styles.searchButtonDisabled]}
          disabled={query.length === 0}
          accessibilityLabel="Search"
          accessibilityRole="button"
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {(showResultsCount || showNavigation) && (
        <View style={styles.resultsRow}>
          {showResultsCount && (
            <Text style={styles.resultsText}>
              {resultsText || (query ? 'No matches' : '')}
            </Text>
          )}

          {showNavigation && hasResults && (
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                onPress={onPrevious}
                style={styles.navButton}
                accessibilityLabel="Previous result"
                accessibilityRole="button"
              >
                <Text style={styles.navButtonText}>↑</Text>
              </TouchableOpacity>

              <Text style={styles.resultIndexText}>
                {currentResultIndex + 1} of {totalResults}
              </Text>

              <TouchableOpacity
                onPress={onNext}
                style={styles.navButton}
                accessibilityLabel="Next result"
                accessibilityRole="button"
              >
                <Text style={styles.navButtonText}>↓</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C6C6C8',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
    padding: 0,
    margin: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 24,
    color: '#8E8E93',
    lineHeight: 22,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#C6C6C8',
  },
  searchButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  resultsText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  resultIndexText: {
    fontSize: 15,
    color: '#000000',
    marginHorizontal: 12,
    minWidth: 50,
    textAlign: 'center',
  },
});

export default SearchBar;