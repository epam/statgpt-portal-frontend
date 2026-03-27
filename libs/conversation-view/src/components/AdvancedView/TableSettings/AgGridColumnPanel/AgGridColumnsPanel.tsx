'use client';

import { DraggableList, InputWithIcon } from '@epam/statgpt-ui-components';
import type { DraggableListItemNode } from '@epam/statgpt-ui-components';
import { useAgGridColumnsPanel } from './useAgGridColumnsPanel';
import { ColumnPanelFilter } from './types';
import { useCallback, useMemo, useState } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';

export function AgGridColumnsPanel({
  api,
  includeColumn,
  enrichItem,
  onSubItemOrderChange,
  onSubItemVisibilityChange,
}: {
  api: GridApi | null;
  includeColumn?: ColumnPanelFilter;
  enrichItem?: (item: DraggableListItemNode) => DraggableListItemNode;
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
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-5 py-7">
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
        />
      </div>
    </div>
  );
}
