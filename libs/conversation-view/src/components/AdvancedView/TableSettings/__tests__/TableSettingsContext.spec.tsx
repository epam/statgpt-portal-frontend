import React from 'react';
import { act, renderHook } from '@testing-library/react';
import type { GridApi } from 'ag-grid-community';
import {
  TableSettingsProvider,
  useTableSettingsContext,
  useTableSettingsContextOptional,
} from '../TableSettingsContext';
import { useAgGridColumnPreferences } from '../AgGridColumnPanel/hooks/useAgGridColumnPreferences';

jest.mock('../AgGridColumnPanel/hooks/useAgGridColumnPreferences');

const mockUseAgGridColumnPreferences = useAgGridColumnPreferences as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockPrefs(gridApi?: Partial<GridApi>) {
  mockUseAgGridColumnPreferences.mockReturnValue({
    gridApi,
    onGridApiReady: jest.fn(),
    initialColumnsState: null,
  });
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <TableSettingsProvider currentUrn="urn:1">{children}</TableSettingsProvider>
  );
}

// ---------------------------------------------------------------------------
// Context access guards
// ---------------------------------------------------------------------------

describe('useTableSettingsContext', () => {
  beforeEach(() => mockPrefs());

  it('throws when used outside TableSettingsProvider', () => {
    // Suppress the expected error from React's error boundary output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useTableSettingsContext())).toThrow(
      'useTableSettingsContext must be used within TableSettingsProvider',
    );

    (console.error as jest.Mock).mockRestore();
  });
});

describe('useTableSettingsContextOptional', () => {
  it('returns null when used outside TableSettingsProvider', () => {
    const { result } = renderHook(() => useTableSettingsContextOptional());
    expect(result.current).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('TableSettingsProvider — initial state', () => {
  beforeEach(() => mockPrefs());

  it('dimensionCustomization starts as an empty Map', () => {
    const { result } = renderHook(() => useTableSettingsContext(), { wrapper });
    expect(result.current.dimensionCustomization.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// setDimensionKeyOrder
// ---------------------------------------------------------------------------

describe('TableSettingsProvider — setDimensionKeyOrder', () => {
  beforeEach(() => mockPrefs());

  it('sets order for the given urn and colId', () => {
    const { result } = renderHook(() => useTableSettingsContext(), { wrapper });

    act(() => {
      result.current.setDimensionKeyOrder('urn:1', 'indicator_col', [
        'IND2',
        'IND1',
      ]);
    });

    const entry = result.current.dimensionCustomization
      .get('urn:1')
      ?.get('indicator_col');
    expect(entry?.order).toEqual(['IND2', 'IND1']);
  });

  it('preserves existing hidden set when updating order', () => {
    const { result } = renderHook(() => useTableSettingsContext(), { wrapper });

    act(() => {
      result.current.setDimensionKeyHidden('urn:1', 'indicator_col', 'IND1', true);
    });
    act(() => {
      result.current.setDimensionKeyOrder('urn:1', 'indicator_col', ['IND2']);
    });

    const entry = result.current.dimensionCustomization
      .get('urn:1')
      ?.get('indicator_col');
    expect(entry?.hidden.has('IND1')).toBe(true);
    expect(entry?.order).toEqual(['IND2']);
  });

  it('calls refreshCells on gridApi with the colId', () => {
    const refreshCells = jest.fn();
    mockPrefs({ refreshCells } as unknown as Partial<GridApi>);

    const { result } = renderHook(() => useTableSettingsContext(), { wrapper });

    act(() => {
      result.current.setDimensionKeyOrder('urn:1', 'indicator_col', ['IND2']);
    });

    expect(refreshCells).toHaveBeenCalledWith({ columns: ['indicator_col'] });
  });

  it('does not throw when gridApi is undefined', () => {
    mockPrefs(undefined);
    const { result } = renderHook(() => useTableSettingsContext(), { wrapper });

    expect(() => {
      act(() => {
        result.current.setDimensionKeyOrder('urn:1', 'col', ['A']);
      });
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// setDimensionKeyHidden
// ---------------------------------------------------------------------------

describe('TableSettingsProvider — setDimensionKeyHidden', () => {
  beforeEach(() => mockPrefs());

  it('adds a dimension key to the hidden set when hidden is true', () => {
    const { result } = renderHook(() => useTableSettingsContext(), { wrapper });

    act(() => {
      result.current.setDimensionKeyHidden('urn:1', 'indicator_col', 'IND1', true);
    });

    const hidden = result.current.dimensionCustomization
      .get('urn:1')
      ?.get('indicator_col')?.hidden;
    expect(hidden?.has('IND1')).toBe(true);
  });

  it('removes a dimension key from the hidden set when hidden is false', () => {
    const { result } = renderHook(() => useTableSettingsContext(), { wrapper });

    act(() => {
      result.current.setDimensionKeyHidden('urn:1', 'indicator_col', 'IND1', true);
    });
    act(() => {
      result.current.setDimensionKeyHidden(
        'urn:1',
        'indicator_col',
        'IND1',
        false,
      );
    });

    const hidden = result.current.dimensionCustomization
      .get('urn:1')
      ?.get('indicator_col')?.hidden;
    expect(hidden?.has('IND1')).toBe(false);
  });

  it('can hide multiple keys independently', () => {
    const { result } = renderHook(() => useTableSettingsContext(), { wrapper });

    act(() => {
      result.current.setDimensionKeyHidden('urn:1', 'indicator_col', 'IND1', true);
      result.current.setDimensionKeyHidden('urn:1', 'indicator_col', 'IND2', true);
    });

    const hidden = result.current.dimensionCustomization
      .get('urn:1')
      ?.get('indicator_col')?.hidden;
    expect(hidden?.has('IND1')).toBe(true);
    expect(hidden?.has('IND2')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resetDimensionCustomization
// ---------------------------------------------------------------------------

describe('TableSettingsProvider — resetDimensionCustomization', () => {
  beforeEach(() => mockPrefs());

  it('clears all dimension customization', () => {
    const { result } = renderHook(() => useTableSettingsContext(), { wrapper });

    act(() => {
      result.current.setDimensionKeyOrder('urn:1', 'indicator_col', ['IND2']);
      result.current.setDimensionKeyHidden('urn:1', 'indicator_col', 'IND1', true);
    });

    expect(result.current.dimensionCustomization.size).toBeGreaterThan(0);

    act(() => {
      result.current.resetDimensionCustomization();
    });

    expect(result.current.dimensionCustomization.size).toBe(0);
  });
});
