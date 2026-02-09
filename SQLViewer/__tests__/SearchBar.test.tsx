import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SearchBar from '../src/components/SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    query: '',
    onQueryChange: jest.fn(),
    onSearch: jest.fn(),
    onClear: jest.fn(),
    onNext: jest.fn(),
    onPrevious: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render correctly with default props', () => {
      const { getByPlaceholderText, getByText } = render(
        <SearchBar {...defaultProps} />
      );

      expect(getByPlaceholderText('Search...')).toBeTruthy();
      expect(getByText('Search')).toBeTruthy();
    });

    it('should display current query', () => {
      const { getByDisplayValue } = render(
        <SearchBar {...defaultProps} query="test query" />
      );

      expect(getByDisplayValue('test query')).toBeTruthy();
    });

    it('should show results count when provided', () => {
      const { getByText } = render(
        <SearchBar
          {...defaultProps}
          resultsText="3 matches found"
          totalResults={3}
        />
      );

      expect(getByText('3 matches found')).toBeTruthy();
    });

    it('should show result index navigation when results exist', () => {
      const { getByText } = render(
        <SearchBar
          {...defaultProps}
          currentResultIndex={1}
          totalResults={5}
        />
      );

      expect(getByText('2 of 5')).toBeTruthy();
    });

    it('should use custom placeholder', () => {
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} placeholder="Search SQL..." />
      );

      expect(getByPlaceholderText('Search SQL...')).toBeTruthy();
    });

    it('should hide navigation when showNavigation is false', () => {
      const { queryByText } = render(
        <SearchBar
          {...defaultProps}
          showNavigation={false}
          currentResultIndex={0}
          totalResults={5}
        />
      );

      expect(queryByText('1 of 5')).toBeNull();
    });

    it('should hide results count when showResultsCount is false', () => {
      const { queryByText } = render(
        <SearchBar
          {...defaultProps}
          showResultsCount={false}
          resultsText="3 matches found"
        />
      );

      expect(queryByText('3 matches found')).toBeNull();
    });
  });

  describe('user interactions', () => {
    it('should call onQueryChange when text is entered', () => {
      const onQueryChange = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} onQueryChange={onQueryChange} />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent.changeText(input, 'test query');

      expect(onQueryChange).toHaveBeenCalledWith('test query');
    });

    it('should call onSearch when search button is pressed', () => {
      const onSearch = jest.fn();
      const { getByText } = render(
        <SearchBar {...defaultProps} onSearch={onSearch} query="test" />
      );

      const searchButton = getByText('Search');
      fireEvent.press(searchButton);

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('should call onSearch when Enter is pressed on input', () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} onSearch={onSearch} />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent(input, 'submitEditing');

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmitEditing when Enter is pressed', () => {
      const onSubmitEditing = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} onSubmitEditing={onSubmitEditing} />
      );

      const input = getByPlaceholderText('Search...');
      fireEvent(input, 'submitEditing');

      expect(onSubmitEditing).toHaveBeenCalledTimes(1);
    });

    it('should show clear button when query is not empty', () => {
      const { getByText } = render(
        <SearchBar {...defaultProps} query="test" />
      );

      expect(getByText('×')).toBeTruthy();
    });

    it('should call onClear when clear button is pressed', () => {
      const onClear = jest.fn();
      const { getByText } = render(
        <SearchBar {...defaultProps} onClear={onClear} query="test" />
      );

      const clearButton = getByText('×');
      fireEvent.press(clearButton);

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when down arrow is pressed', () => {
      const onNext = jest.fn();
      const { getByText } = render(
        <SearchBar {...defaultProps} onNext={onNext} totalResults={3} />
      );

      const nextButton = getByText('↓');
      fireEvent.press(nextButton);

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should call onPrevious when up arrow is pressed', () => {
      const onPrevious = jest.fn();
      const { getByText } = render(
        <SearchBar {...defaultProps} onPrevious={onPrevious} totalResults={3} />
      );

      const prevButton = getByText('↑');
      fireEvent.press(prevButton);

      expect(onPrevious).toHaveBeenCalledTimes(1);
    });
  });

  describe('search button', () => {
    it('should be disabled when query is empty', () => {
      const { getByText } = render(
        <SearchBar {...defaultProps} query="" />
      );

      const searchButton = getByText('Search');
      expect(searchButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should be enabled when query is not empty', () => {
      const { getByText } = render(
        <SearchBar {...defaultProps} query="test" />
      );

      const searchButton = getByText('Search');
      expect(searchButton.props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('navigation buttons', () => {
    it('should render navigation buttons when results exist', () => {
      const { getByText } = render(
        <SearchBar
          {...defaultProps}
          totalResults={3}
          currentResultIndex={0}
        />
      );

      expect(getByText('↑')).toBeTruthy();
      expect(getByText('↓')).toBeTruthy();
    });

    it('should render navigation buttons when totalResults is 0', () => {
      const { queryByText } = render(
        <SearchBar {...defaultProps} totalResults={0} />
      );

      expect(queryByText('↑')).toBeNull();
      expect(queryByText('↓')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have correct accessibility labels', () => {
      const { getByLabelText } = render(
        <SearchBar {...defaultProps} totalResults={3} />
      );

      expect(getByLabelText('Clear search')).toBeTruthy();
      expect(getByLabelText('Search')).toBeTruthy();
      expect(getByLabelText('Previous result')).toBeTruthy();
      expect(getByLabelText('Next result')).toBeTruthy();
    });

    it('should have correct accessibility roles', () => {
      const { getByLabelText } = render(
        <SearchBar {...defaultProps} totalResults={3} />
      );

      expect(getByLabelText('Clear search').props.accessibilityRole).toBe('button');
      expect(getByLabelText('Search').props.accessibilityRole).toBe('button');
      expect(getByLabelText('Previous result').props.accessibilityRole).toBe('button');
      expect(getByLabelText('Next result').props.accessibilityRole).toBe('button');
    });
  });

  describe('autoFocus', () => {
    it('should focus input when autoFocus is true', async () => {
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} autoFocus={true} />
      );

      const input = getByPlaceholderText('Search...');
      
      await waitFor(() => {
        expect(input.props.autoFocus).toBe(true);
      });
    });
  });

  describe('styles', () => {
    it('should apply correct styles to container', () => {
      const { getByTestId } = render(
        <SearchBar {...defaultProps} />
      );

      const container = getByTestId('search-bar-container');
      expect(container.props.style).toMatchObject({
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 12,
      });
    });
  });
});