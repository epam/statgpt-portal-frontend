'use client';

import { CustomGridAttachment } from '../../../models/attachments';
import { FC, useEffect, useMemo, useState } from 'react';
import { Loader, SERIES_LIMIT } from '@epam/statgpt-ui-components';
import type { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridData } from '../../../types/data-grid/grid-data';
import { getGridHeight } from '../../../utils/attachments/data-grid/grid-height';
import {
  CHART_CELL_RENDER,
  CHART_COLUMN_ID,
  GRID_HEADER_HEIGHT,
  GRID_ROW_HEIGHT,
  METADATA_CELL_RENDER,
  OBSERVATION_VALUE_CELL_RENDER,
} from '../../../constants/grid';
import MetadataCellRenderer from '../GridCellRenderers/MetadataCellRenderer';
import ObservationValueCellRenderer from '../GridCellRenderers/ObservationValueCellRenderer';
import ChartCellRenderer from '../GridCellRenderers/ChartCellRenderer';
import GridContainer from './GridContainer';

interface Props {
  attachment: CustomGridAttachment;
  isDataLoading?: boolean;
  showChartColumn?: boolean;
  fixHeight?: boolean;
  showLimitMessage?: (p: boolean) => void;
}

const CrossDatasetGridAttachment: FC<Props> = ({
  attachment,
  isDataLoading,
  showChartColumn,
  fixHeight,
  showLimitMessage,
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
          return { ...col, hide: !showChartColumn };
        }
        return col;
      });
      setRowData(attachment.grid_data.data);
      setColumnDefs(columns);
      setIsLoading(false);
    }
  }, [attachment.grid_data, showChartColumn]);

  useEffect(() => {
    if (rowData) {
      setGridHeight(getGridHeight(rowData.length));
      showLimitMessage?.(rowData.length >= SERIES_LIMIT);
    } else {
      showLimitMessage?.(false);
    }
  }, [rowData, showLimitMessage]);

  //TODO: replace cell renderers
  const memoizedGrid = useMemo(
    () => (
      <AgGridReact
        headerHeight={GRID_HEADER_HEIGHT}
        rowHeight={GRID_ROW_HEIGHT}
        rowData={rowData}
        enableCellTextSelection
        columnDefs={columnDefs}
        domLayout="normal"
        tooltipShowDelay={0}
        tooltipShowMode="whenTruncated"
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
      <GridContainer fixHeight={fixHeight} gridHeight={gridHeight}>
        {memoizedGrid}
      </GridContainer>
    </div>
  );
};

export default CrossDatasetGridAttachment;
