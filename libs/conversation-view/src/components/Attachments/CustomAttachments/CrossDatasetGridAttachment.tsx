'use client';

import { CrossDatasetGridAttachmentType } from '../../../models/attachments';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader, SERIES_LIMIT } from '@epam/statgpt-ui-components';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridData } from '../../../types/data-grid/grid-data';
import { getGridHeight } from '../../../utils/attachments/data-grid/grid-height';
import {
  CHART_CELL_RENDER,
  CHART_COLUMN_ID,
  GRID_HEADER_HEIGHT,
  GRID_ROW_HEIGHT,
  MERGED_DIMENSION_CELL_RENDER,
  METADATA_CELL_RENDER,
  OBSERVATION_VALUE_CELL_RENDER,
  DATASET_DETAIL_CELL_RENDER,
} from '../../../constants/grid';
import MetadataCellRenderer from '../GridCellRenderers/MetadataCellRenderer';
import ObservationValueCellRenderer from '../GridCellRenderers/ObservationValueCellRenderer';
import ChartCellRenderer from '../GridCellRenderers/ChartCellRenderer';
import MergedDimensionCellRenderer from '../GridCellRenderers/MergedDimensionCellRenderer';
import DatasetDetailCellRenderer from '../GridCellRenderers/DatasetDetailCellRenderer';
import GridContainer from './GridContainer';

interface Props {
  attachment: CrossDatasetGridAttachmentType;
  isDataLoading?: boolean;
  isChartColumnVisible?: boolean;
  fixHeight?: boolean;
  externalLink?: string;
  externalLinksMap?: Map<string, string>;
  showLimitMessage?: (p: boolean) => void;
  onApiReady?: (api: GridApi) => void;
}

const CrossDatasetGridAttachment: FC<Props> = ({
  attachment,
  isDataLoading,
  isChartColumnVisible,
  fixHeight,
  externalLink,
  externalLinksMap,
  showLimitMessage,
  onApiReady,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rowData, setRowData] = useState<GridData[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>();
  const [gridHeight, setGridHeight] = useState<number>(400);

  useEffect(() => {
    if (attachment.gridContent == null) {
      setIsLoading(true);
    } else {
      const columns = attachment.gridContent.columns.map((col) => {
        if (col.colId === CHART_COLUMN_ID) {
          return { ...col, hide: !isChartColumnVisible };
        }
        return col;
      });
      setRowData(attachment.gridContent.data);
      setColumnDefs(columns);
      setIsLoading(false);
    }
  }, [attachment.gridContent, isChartColumnVisible]);

  useEffect(() => {
    if (rowData) {
      setGridHeight(getGridHeight(rowData.length));
      showLimitMessage?.(rowData.length >= SERIES_LIMIT);
    } else {
      showLimitMessage?.(false);
    }
  }, [rowData, showLimitMessage]);

  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      onApiReady?.(event.api);
    },
    [onApiReady],
  );

  const gridContext = useMemo(
    () => ({ externalLink, externalLinksMap }),
    [externalLink, externalLinksMap],
  );
  const gridComponents = useMemo(
    () => ({
      [METADATA_CELL_RENDER]: MetadataCellRenderer,
      [OBSERVATION_VALUE_CELL_RENDER]: ObservationValueCellRenderer,
      [MERGED_DIMENSION_CELL_RENDER]: MergedDimensionCellRenderer,
      [CHART_CELL_RENDER]: ChartCellRenderer,
      [DATASET_DETAIL_CELL_RENDER]: DatasetDetailCellRenderer,
    }),
    [],
  );

  //TODO: replace cell renderers
  const memoizedGrid = useMemo(
    () => (
      <AgGridReact
        headerHeight={GRID_HEADER_HEIGHT}
        rowHeight={GRID_ROW_HEIGHT}
        rowData={rowData}
        enableCellTextSelection
        columnDefs={columnDefs}
        context={gridContext}
        domLayout="normal"
        tooltipShowDelay={0}
        tooltipShowMode="whenTruncated"
        components={gridComponents}
        valueCache
        onGridReady={handleGridReady}
      />
    ),
    [rowData, columnDefs, gridContext, gridComponents, handleGridReady],
  );

  if (isLoading || isDataLoading) {
    return <Loader />;
  }

  return (
    <div className="size-full">
      <GridContainer fixHeight={fixHeight} gridHeight={gridHeight}>
        {memoizedGrid}
      </GridContainer>
    </div>
  );
};

export default CrossDatasetGridAttachment;
