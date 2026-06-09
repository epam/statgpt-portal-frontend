import { IconRotate } from '@tabler/icons-react';
import { useCallback, useMemo } from 'react';
import { AgGridColumnsPanel } from './AgGridColumnPanel/AgGridColumnsPanel';
import { buildCrossDatasetEnrichItem } from './helpers/crossDatasetEnrichment';
import { restoreInitialColumnsState } from './AgGridColumnPanel/helpers/columnStateSnapshot';
import { useTableSettingsContext } from './TableSettingsContext';
import { useDatasetDimensionsMetadataMapOptional } from '../../../context/DatasetDimensionsMetadataMapContext';
import { CrossDatasetGridViewMode } from './types';
import { useDatasetScopedColumnRenderLabel } from './hooks/useDatasetScopedColumnRenderLabel';
import { GridViewModeSwitcher } from './GridViewModeSwitcher/GridViewModeSwitcher';

export const TABLE_SETTINGS_SIDE_PANEL_ID = 'table-settings-side-panel';

/**
 * Renders the column visibility and order panel for the AG Grid table,
 * enriching merged cross-dataset columns with dimension metadata when available.
 *
 * The panel is hidden (returns `null`) until the AG Grid API is ready. When
 * cross-dataset context, structure maps, and data queries are all present, it
 * computes an `enrichItem` callback that supplies human-readable dimension
 * labels and sub-item customization to `AgGridColumnsPanel`.
 *
 * @example
 * Mounting inside a side panel
 * ```tsx
 * <SidePanel id={TABLE_SETTINGS_SIDE_PANEL_ID}>
 *   <TableSettingsPanel />
 * </SidePanel>
 * ```
 */
export const TableSettingsPanel = () => {
  const {
    gridApi,
    initialColumnsState,
    structuresMap,
    locale,
    dataQueries,
    dimensionCustomization,
    setDimensionKeyOrder,
    setDimensionKeyHidden,
    resetDimensionCustomization,
    clearUserColumnState,
    clearInitialColumnState,
    gridViewMode,
    setGridViewMode,
    texts,
    resetIcon,
  } = useTableSettingsContext();
  const dimensionsCtx = useDatasetDimensionsMetadataMapOptional();
  const renderLabel = useDatasetScopedColumnRenderLabel();

  const handleModeChange = useCallback(
    (mode: CrossDatasetGridViewMode) => {
      clearUserColumnState();
      clearInitialColumnState();
      resetDimensionCustomization();
      setGridViewMode(mode);
    },
    [
      clearUserColumnState,
      clearInitialColumnState,
      resetDimensionCustomization,
      setGridViewMode,
    ],
  );

  const resetColumns = useCallback(() => {
    if (!gridApi) {
      return;
    }
    clearUserColumnState();
    if (initialColumnsState) {
      restoreInitialColumnsState(gridApi, initialColumnsState);
    } else {
      gridApi.resetColumnState();
    }
    resetDimensionCustomization();
  }, [
    clearUserColumnState,
    gridApi,
    initialColumnsState,
    resetDimensionCustomization,
  ]);

  const enrichItem = useMemo(() => {
    if (
      gridViewMode !== CrossDatasetGridViewMode.Compact ||
      !dimensionsCtx ||
      !structuresMap ||
      !locale ||
      !dataQueries?.length
    ) {
      return undefined;
    }

    return buildCrossDatasetEnrichItem({
      dataQueries,
      structuresMap,
      getDimensionsScheme: dimensionsCtx.getDimensionsScheme,
      getDimensionConfig: (urn, dimKey) => dimensionsCtx.map[urn]?.[dimKey],
      locale,
      dimensionCustomization,
    });
  }, [
    gridViewMode,
    dimensionsCtx,
    structuresMap,
    locale,
    dataQueries,
    dimensionCustomization,
  ]);

  return gridApi ? (
    <div className="flex h-full flex-col">
      <GridViewModeSwitcher
        gridViewMode={gridViewMode}
        onModeChange={handleModeChange}
        compactViewTitle={texts?.compactViewTitle}
        compactViewDescription={texts?.compactViewDescription}
        extendedViewTitle={texts?.extendedViewTitle}
        extendedViewDescription={texts?.extendedViewDescription}
      />
      <hr className="border-neutrals-500" />
      <div className="mx-5 mb-4 mt-5 flex items-center justify-between">
        <h3 className="text-neutrals-1000">
          {texts?.columnsDisplayTitle || 'Columns display'}
        </h3>
        <button
          type="button"
          className="text-neutrals-800"
          onClick={resetColumns}
        >
          {resetIcon ?? <IconRotate className="size-4 rotate-180" />}
        </button>
      </div>
      <AgGridColumnsPanel
        api={gridApi}
        enrichItem={enrichItem}
        renderLabel={renderLabel}
        onSubItemOrderChange={setDimensionKeyOrder}
        onSubItemVisibilityChange={setDimensionKeyHidden}
        searchPlaceholder={texts?.columnsSearchPlaceholder}
      />
    </div>
  ) : null;
};
