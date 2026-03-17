import { IconRotate, IconX } from '@tabler/icons-react';
import { useCallback } from 'react';
import { GridApi } from 'ag-grid-community';
import { AgGridColumnsPanel } from './AgGridColumnPanel/AgGridColumnsPanel';
import { useAgGridColumnsReset } from './AgGridColumnPanel/useAgGridColumnsReset';
import type { AgGridInitialColumnsState } from './AgGridColumnPanel/types';

export const TableSettingsPanel = ({
  onClose,
  gridApi,
  initialColumnsState,
  title,
  resetTitle,
}: {
  onClose?: () => void;
  gridApi?: GridApi;
  initialColumnsState?: AgGridInitialColumnsState | null;
  title?: string;
  resetTitle?: string;
}) => {
  const { resetColumns } = useAgGridColumnsReset(gridApi, initialColumnsState);

  const closeHandler = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <div className="h-full w-[362px] bg-white border-l border-neutrals-500 flex flex-col overflow-hidden">
      <div className="flex justify-between border-b border-neutrals-500 px-5 py-6">
        <div className="h2 text-neutrals-1000">{title || 'Columns'}</div>
        <div className="flex gap-2 items-center">
          <button
            className="text-neutrals-800 flex gap-1 items-center"
            onClick={resetColumns}
          >
            <IconRotate className="rotate-180 size-4" />{' '}
            <span className="h4">{resetTitle || 'Reset'}</span>
          </button>
          <div className="h-3 w-[1px] bg-neutrals-600" />
          <button onClick={closeHandler}>
            <IconX className="size-5 text-neutrals-1000" />
          </button>
        </div>
      </div>
      {gridApi && <AgGridColumnsPanel api={gridApi} />}
    </div>
  );
};
