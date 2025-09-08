'use client';

import { CustomGridAttachment } from '@statgpt/conversation-view/src/models/attachments';
import { FC, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';
import type { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridData } from '@statgpt/conversation-view/src/types/data-grid/grid-data';
import { getGridHeight } from '@statgpt/conversation-view/src/utils/attachments/data-grid/grid-height';
import {
  CHART_CELL_RENDER,
  CHART_COLUMN_ID,
  GRID_HEADER_HEIGHT,
  GRID_ROW_HEIGHT,
  METADATA_CELL_RENDER,
  OBSERVATION_VALUE_CELL_RENDER,
} from '@statgpt/conversation-view/src/constants/grid';
import MetadataCellRenderer from '@statgpt/conversation-view/src/components/Attachments/GridCellRenderers/MetadataCellRenderer';
import ObservationValueCellRenderer from '@statgpt/conversation-view/src/components/Attachments/GridCellRenderers/ObservationValueCellRenderer';
import ChartCellRenderer from '@statgpt/conversation-view/src/components/Attachments/GridCellRenderers/ChartCellRenderer';

interface Props {
  attachment: CustomGridAttachment;
  isDataLoading?: boolean;
  chartColumn?: boolean;
  fixHeight?: boolean;
}

const CustomDataGridAttachment: FC<Props> = ({
  attachment,
  isDataLoading,
  chartColumn,
  fixHeight,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rowData, setRowData] = useState<GridData[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>();
  const [gridHeight, setGridHeight] = useState<number>(400);

  useEffect(() => {
    if (attachment.grid_data == null) {
      setIsLoading(true);
    } else {
      const columns = attachment.grid_data.columns.map((col) => {
        if (col.colId === CHART_COLUMN_ID) {
          return { ...col, hide: !chartColumn };
        }
        return col;
      });
      setRowData(attachment.grid_data.data);
      setColumnDefs(columns);
      setIsLoading(false);
    }
  }, [attachment.grid_data, chartColumn]);

  useEffect(() => {
    if (rowData) {
      setGridHeight(getGridHeight(rowData.length));
    }
  }, [rowData]);

  const memoizedGrid = useMemo(
    () => (
      <AgGridReact
        headerHeight={GRID_HEADER_HEIGHT}
        rowHeight={GRID_ROW_HEIGHT}
        rowData={rowData}
        columnDefs={columnDefs}
        domLayout="normal"
        components={{
          [METADATA_CELL_RENDER]: MetadataCellRenderer,
          [OBSERVATION_VALUE_CELL_RENDER]: ObservationValueCellRenderer,
          [CHART_CELL_RENDER]: ChartCellRenderer,
        }}
      />
    ),
    [rowData, columnDefs],
  );

  if (isLoading || isDataLoading) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full">
      <div
        className={classNames(
          'ag-theme-quartz w-full min-h-[80px]',
          fixHeight ? 'max-h-[400px]' : 'max-h-full',
        )}
        style={{ height: gridHeight }}
      >
        {memoizedGrid}
      </div>
    </div>
  );
};

export default CustomDataGridAttachment;
