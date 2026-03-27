import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { GridApi } from 'ag-grid-community';
import { AgGridColumnsPanel } from '../AgGridColumnsPanel';
import { useAgGridColumnsPanel } from '../hooks/useAgGridColumnsPanel';

// Mock the hook so tests control what visibleItems the component sees
jest.mock('../hooks/useAgGridColumnsPanel');

// Mock DraggableList to avoid dnd-kit internals in component tests
jest.mock('@epam/statgpt-ui-components', () => {
  const actual = jest.requireActual('@epam/statgpt-ui-components');
  return {
    ...actual,
    DraggableList: ({ items }: { items: unknown[] }) => (
      <div data-testid="draggable-list" data-item-count={items.length} />
    ),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockHandlers = {
  items: [],
  visibleItems: [],
  handleItemsChange: jest.fn(),
  handleToggleChecked: jest.fn(),
  handleToggleExpanded: jest.fn(),
  handleItemClick: jest.fn(),
};

const mockUseAgGridColumnsPanel = useAgGridColumnsPanel as jest.Mock;

function renderPanel(api: GridApi | null = null) {
  return render(<AgGridColumnsPanel api={api} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AgGridColumnsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAgGridColumnsPanel.mockReturnValue(mockHandlers);
  });

  it('renders a search input with placeholder "Search"', () => {
    renderPanel();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('passes searchQuery to the hook when the user types', () => {
    renderPanel();

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'price' },
    });

    expect(mockUseAgGridColumnsPanel).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchQuery: 'price' }),
    );
  });

  it('does not render a clear button when searchQuery is empty', () => {
    renderPanel();
    // The clear button wraps an <IconX>; simplest proxy is looking for a button inside the search area
    const input = screen.getByPlaceholderText('Search');
    const container = input.closest('div')!;
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders a clear button when searchQuery is non-empty', () => {
    renderPanel();

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'foo' },
    });

    const input = screen.getByPlaceholderText('Search');
    const container = input.closest('div')!;
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('clears searchQuery when the clear button is clicked', () => {
    renderPanel();

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'foo' },
    });

    const input = screen.getByPlaceholderText('Search');
    const container = input.closest('div')!;
    fireEvent.click(container.querySelector('button')!);

    expect(mockUseAgGridColumnsPanel).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchQuery: '' }),
    );
  });

  it('renders DraggableList with visibleItems from the hook', () => {
    const visibleItems = [
      { type: 'item' as const, id: 'col1', label: 'Column 1' },
      { type: 'item' as const, id: 'col2', label: 'Column 2' },
    ];
    mockUseAgGridColumnsPanel.mockReturnValue({
      ...mockHandlers,
      visibleItems,
    });

    renderPanel();

    const list = screen.getByTestId('draggable-list');
    expect(list).toBeInTheDocument();
    expect(list.getAttribute('data-item-count')).toBe('2');
  });

  it('passes api prop to the hook', () => {
    const api = {} as GridApi;
    render(<AgGridColumnsPanel api={api} />);

    expect(mockUseAgGridColumnsPanel).toHaveBeenCalledWith(
      expect.objectContaining({ api }),
    );
  });
});
