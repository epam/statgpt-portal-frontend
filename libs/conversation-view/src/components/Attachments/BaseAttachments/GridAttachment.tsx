'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC, useEffect, useMemo, useState } from 'react';
import { Loader, SERIES_LIMIT } from '@epam/statgpt-ui-components';
import { convertToGridData } from '../../../utils/attachments/convert-to-grid-data';
import type { ColDef } from 'ag-grid-community';
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TooltipModule,
  ColumnAutoSizeModule,
  CellStyleModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { AttachmentsActions } from '../../../models/actions';
import { GridData } from '../../../types/data-grid/grid-data';
import { GRID_HEADER_HEIGHT, GRID_ROW_HEIGHT } from '../../../constants/grid';
import { getGridHeight } from '../../../utils/attachments/data-grid/grid-height';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TooltipModule,
  ColumnAutoSizeModule,
  CellStyleModule,
]);

const DEFAULT_COL_DEF: ColDef = { cellDataType: false };

interface Props {
  attachment: Attachment;
  className?: string;
  actions: AttachmentsActions;
  showLimitMessage?: (p: boolean) => void;
}

const GridAttachment: FC<Props> = ({
  attachment,
  actions,
  className = '',
  showLimitMessage,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rowData, setRowData] = useState<GridData[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>();
  const [gridHeight, setGridHeight] = useState<number>(400);

  useEffect(() => {
    if (attachment.url == null) {
      return;
    }
    setIsLoading(true);
    actions.getFile(attachment.url).then((content) => {
      if (content == null) {
        setRowData([]);
        setColumnDefs([]);
        setIsLoading(false);
        return;
      }
      const { columns, data } = convertToGridData(content);
      setRowData(data);
      setColumnDefs(columns);
      setIsLoading(false);
    });
  }, [attachment.url, actions]);

  useEffect(() => {
    if (rowData) {
      setGridHeight(getGridHeight(rowData.length));
      showLimitMessage?.(rowData.length >= SERIES_LIMIT);
    } else {
      showLimitMessage?.(false);
    }
  }, [rowData, showLimitMessage]);

  const memoizedGrid = useMemo(
    () => (
      <AgGridReact
        headerHeight={GRID_HEADER_HEIGHT}
        rowHeight={GRID_ROW_HEIGHT}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={DEFAULT_COL_DEF}
        enableCellTextSelection
        domLayout="normal"
        tooltipShowDelay={0}
        tooltipShowMode="whenTruncated"
        autoSizeStrategy={{
          type:
            columnDefs && columnDefs?.length > 5
              ? 'fitCellContents'
              : 'fitGridWidth',
        }}
      />
    ),
    [rowData, columnDefs],
  );

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className="ag-theme-quartz max-h-[400px] min-h-[80px] w-full"
        style={{ height: gridHeight }}
      >
        {memoizedGrid}
      </div>
    </div>
  );
};

export default GridAttachment;
