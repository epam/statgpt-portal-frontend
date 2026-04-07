'use client';

import { DraggableList, InputWithIcon } from '@epam/statgpt-ui-components';
import type { DraggableListItemNode } from '@epam/statgpt-ui-components';
import { useAgGridColumnsPanel } from './hooks/useAgGridColumnsPanel';
import { ColumnPanelFilter } from './types';
import { useCallback, useMemo, useState } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';
import type { ReactNode } from 'react';

/**
 * AgGridColumnsPanel renders a searchable, drag-and-drop column visibility
 * panel that reflects and controls the visible columns of an AG Grid instance.
 *
 * The panel reads column state from the provided `GridApi`, syncs changes back
 * via AG Grid's column API, and delegates sub-item reordering and visibility
 * toggling to the optional callback props. An optional `includeColumn` filter
 * restricts which columns appear in the list, and `enrichItem` allows callers
 * to decorate each list node before rendering.
 *
 * @example
 * Basic usage inside a table settings panel
 * ```tsx
 * <AgGridColumnsPanel
 *   api={gridRef.current?.api ?? null}
 *   includeColumn={(col) => !col.getColDef().hide}
 *   onSubItemOrderChange={(urn, colId, order) => saveOrder(urn, colId, order)}
 *   onSubItemVisibilityChange={(urn, colId, key, hidden) =>
 *     saveVisibility(urn, colId, key, hidden)
 *   }
 * />
 * ```
 *
 * @param api - AG Grid API instance used to read and write column state.
 * @param includeColumn - Optional predicate to filter which columns appear in the panel.
 * @param enrichItem - Optional transformer applied to each draggable list node before rendering.
 * @param onSubItemOrderChange - Called when the order of sub-items within a column group changes.
 * @param onSubItemVisibilityChange - Called when the visibility of a single dimension value is toggled.
 */
export function AgGridColumnsPanel({
  api,
  includeColumn,
  enrichItem,
  renderLabel,
  onSubItemOrderChange,
  onSubItemVisibilityChange,
}: {
  api: GridApi | null;
  includeColumn?: ColumnPanelFilter;
  enrichItem?: (item: DraggableListItemNode) => DraggableListItemNode;
  renderLabel?: (item: DraggableListItemNode) => ReactNode;
  onSubItemOrderChange?: (urn: string, colId: string, order: string[]) => void;
  onSubItemVisibilityChange?: (
    urn: string,
    colId: string,
    dimensionKey: string,
    hidden: boolean,
  ) => void;
}) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const changeSearchHandler = useCallback(
    (search: string) => {
      setSearchQuery(search);
    },
    [setSearchQuery],
  );

  const clearSearchHandler = useCallback(
    () => setSearchQuery(''),
    [setSearchQuery],
  );

  const clearSearchButton = useMemo(
    () => (
      <button type="button" onClick={clearSearchHandler}>
        <IconX className="size-4 text-neutrals-1000" />
      </button>
    ),
    [clearSearchHandler],
  );

  const {
    visibleItems,
    handleItemsChange,
    handleToggleChecked,
    handleToggleExpanded,
    handleItemClick,
  } = useAgGridColumnsPanel({
    api,
    includeColumn,
    searchQuery,
    enrichItem,
    onSubItemOrderChange,
    onSubItemVisibilityChange,
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 px-5 py-7">
      <InputWithIcon
        inputId="columns-search-input"
        containerClasses={'items-center filters-search-input gap-1 !p-2'}
        cssClass="filters-search-input-text"
        placeholder="Search"
        iconBeforeInput={<IconSearch className="size-4 text-neutrals-1000" />}
        iconAfterInput={searchQuery ? clearSearchButton : undefined}
        value={searchQuery}
        onChange={changeSearchHandler}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <DraggableList
          items={visibleItems}
          onItemsChange={handleItemsChange}
          onToggleChecked={handleToggleChecked}
          onToggleExpanded={handleToggleExpanded}
          onItemClick={handleItemClick}
          renderLabel={renderLabel}
        />
      </div>
    </div>
  );
}
