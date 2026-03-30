'use client';

import { useEffect } from 'react';
import type { GridApi } from 'ag-grid-community';

const COLUMN_SYNC_EVENTS = [
  'columnVisible',
  'columnMoved',
  'displayedColumnsChanged',
  'newColumnsLoaded',
  'gridColumnsChanged',
  'columnPinned',
] as const satisfies ReadonlyArray<string>;

/**
 * Registers AG Grid column-change event listeners on the provided grid API and cleans them up on unmount,
 * invoking the given callback whenever column visibility, order, pinning, or structure changes.
 */
export function useAgGridColumnGridListeners(
  api: GridApi | null | undefined,
  listener: () => void,
) {
  useEffect(() => {
    if (!api) {
      return;
    }

    for (const eventName of COLUMN_SYNC_EVENTS) {
      api.addEventListener(eventName, listener);
    }

    return () => {
      for (const eventName of COLUMN_SYNC_EVENTS) {
        api.removeEventListener(eventName, listener);
      }
    };
  }, [api, listener]);
}
