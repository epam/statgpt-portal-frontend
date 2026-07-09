'use client';

import { CrossDatasetGridAttachmentType } from '../../../models/attachments';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import {
  Loader,
  MOBILE_BREAKPOINT,
  SERIES_LIMIT,
  useIsMobile,
} from '@epam/statgpt-ui-components';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TooltipModule,
  ValueCacheModule,
  ColumnApiModule,
  CellStyleModule,
  EventApiModule,
  RenderApiModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridData } from '../../../types/data-grid/grid-data';
import { getGridHeight } from '../../../utils/attachments/data-grid/grid-height';
import {
  applyMobileColumnWidth,
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

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TooltipModule,
  ValueCacheModule,
  ColumnApiModule,
  CellStyleModule,
  EventApiModule,
  RenderApiModule,
]);

const DEFAULT_COL_DEF: ColDef = { cellDataType: false };

interface Props {
  attachment: CrossDatasetGridAttachmentType;
  isDataLoading?: boolean;
  isChartColumnVisible?: boolean;
  fixHeight?: boolean;
  externalLink?: string;
  externalLinksMap?: Map<string, string>;
  showLimitMessage?: (p: boolean) => void;
  onApiReady?: (api: GridApi) => void;
  onGridRenderedChange?: (isRendered: boolean) => void;
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
  onGridRenderedChange,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGridRendered, setIsGridRendered] = useState<boolean>(false);
  const [rowData, setRowData] = useState<GridData[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>();
  const [gridHeight, setGridHeight] = useState<number>(400);
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);
  const gridApiRef = useRef<GridApi | null>(null);
  const prevColIdsRef = useRef<string[]>([]);

  useEffect(() => {
    onGridRenderedChange?.(isGridRendered);
  }, [isGridRendered, onGridRenderedChange]);

  useEffect(() => {
    if (attachment.gridContent == null) {
      setIsLoading(true);
      setIsGridRendered(false);
    } else {
      const columns = attachment.gridContent.columns.map((col) => {
        if (col.colId === CHART_COLUMN_ID) {
          return { ...col, hide: !isChartColumnVisible };
        }
        return applyMobileColumnWidth(col, isMobile);
      });

      setRowData(attachment.gridContent.data);
      setColumnDefs(columns);
      setIsLoading(false);
    }
  }, [attachment.gridContent, isChartColumnVisible, isMobile]);

  useEffect(() => {
    if (rowData) {
      setGridHeight(getGridHeight(rowData.length));
      showLimitMessage?.(rowData.length >= SERIES_LIMIT);
    } else {
      showLimitMessage?.(false);
    }
  }, [rowData, showLimitMessage]);

  useEffect(() => {
    if (!columnDefs || !gridApiRef.current) return;

    const newColIds = columnDefs
      .map((col) => col.colId ?? col.field ?? '')
      .filter(Boolean);
    const prevColIds = prevColIdsRef.current;
    const prevColIdSet = new Set(prevColIds);
    const colStructureChanged =
      newColIds.length !== prevColIds.length ||
      newColIds.some((id) => !prevColIdSet.has(id));

    prevColIdsRef.current = newColIds;

    if (colStructureChanged) {
      gridApiRef.current.resetColumnState();
    }
  }, [columnDefs]);

  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      onApiReady?.(event.api);
    },
    [onApiReady],
  );

  const handleFirstDataRendered = useCallback(() => {
    setIsGridRendered(true);
  }, []);

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
        defaultColDef={DEFAULT_COL_DEF}
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
        onFirstDataRendered={handleFirstDataRendered}
      />
    ),
    [
      rowData,
      columnDefs,
      gridContext,
      gridComponents,
      handleGridReady,
      handleFirstDataRendered,
    ],
  );

  if (isLoading || isDataLoading) {
    // Reserve the grid box height while loading. The height class must sit
    // inside a flex-column so `min-height` is a main-axis size and reserves
    // space; as a direct flex-row child of the content renderer it would be a
    // cross-axis size and overflow, collapsing the attachment.
    return (
      <div className="size-full">
        <div className="flex size-full flex-col">
          <div
            className={classNames(
              'flex items-center justify-center',
              fixHeight
                ? 'h-full max-h-[400px] min-h-[400px]'
                : 'h-full min-h-[300px]',
            )}
          >
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full">
      <GridContainer fixHeight={fixHeight} gridHeight={gridHeight}>
        {memoizedGrid}
      </GridContainer>
    </div>
  );
};

export { CrossDatasetGridAttachment };
