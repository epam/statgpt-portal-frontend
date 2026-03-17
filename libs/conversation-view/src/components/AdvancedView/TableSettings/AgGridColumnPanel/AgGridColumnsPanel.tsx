'use client';

import { DraggableList, InputWithIcon } from '@epam/statgpt-ui-components';
import { useAgGridColumnsPanel } from './useAgGridColumnsPanel';
import { ColumnPanelFilter } from './types';
import { useCallback, useMemo, useState } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';

export function AgGridColumnsPanel({
  api,
  includeColumn,
}: {
  api: GridApi | null;
  includeColumn?: ColumnPanelFilter;
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
      <button onClick={clearSearchHandler}>
        <IconX className="text-neutrals-1000 size-4" />
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
  });

  return (
    <div className="px-5 py-7 flex flex-col gap-2 h-full">
      <InputWithIcon
        inputId="columns-search-input"
        containerClasses={'items-center filters-search-input gap-1 !p-2'}
        cssClass="filters-search-input-text"
        placeholder="Search"
        iconBeforeInput={<IconSearch className="text-neutrals-1000 size-4" />}
        iconAfterInput={searchQuery ? clearSearchButton : undefined}
        value={searchQuery}
        onChange={changeSearchHandler}
      />
      <div className="overflow-y-scroll h-[calc(100%-104px)]">
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
