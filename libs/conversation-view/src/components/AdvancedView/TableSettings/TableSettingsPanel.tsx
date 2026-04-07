import { IconRotate } from '@tabler/icons-react';
import { useCallback, useMemo } from 'react';
import { AgGridColumnsPanel } from './AgGridColumnPanel/AgGridColumnsPanel';
import { buildCrossDatasetEnrichItem } from './helpers/crossDatasetEnrichment';
import { restoreInitialColumnsState } from './AgGridColumnPanel/helpers/columnStateSnapshot';
import { useTableSettingsContext } from './TableSettingsContext';
import { useDatasetDimensionsMetadataMapOptional } from '../../../context/DatasetDimensionsMetadataMapContext';
import { useOtherColumnRenderLabel } from './hooks/useOtherColumnRenderLabel';

export const TABLE_SETTINGS_SIDE_PANEL_ID = 'table-settings-side-panel';

/**
 * Renders a reset button intended for use as a header extension inside the
 * table settings side panel.
 *
 * The button restores all column visibility and order to the initial snapshot
 * and clears any dimension customization tracked by `TableSettingsContext`.
 *
 * @example
 * Embedding in a panel header
 * ```tsx
 * <SidePanel
 *   id={TABLE_SETTINGS_SIDE_PANEL_ID}
 *   headerExtension={<TableSettingsPanelHeaderExtension resetTitle="Restore" />}
 * />
 * ```
 *
 * @param resetTitle - Label shown next to the rotate icon. Defaults to "Reset".
 */
export const TableSettingsPanelHeaderExtension = ({
  resetTitle,
}: {
  resetTitle?: string;
}) => {
  const { gridApi, initialColumnsState, resetDimensionCustomization } =
    useTableSettingsContext();

  const resetColumns = useCallback(() => {
    if (!gridApi) {
      return;
    }

    restoreInitialColumnsState(gridApi, initialColumnsState);
    resetDimensionCustomization();
  }, [gridApi, initialColumnsState, resetDimensionCustomization]);

  const headerExtension = (
    <button
      type="button"
      className="flex items-center gap-1 text-neutrals-800"
      onClick={resetColumns}
    >
      <IconRotate className="size-4 rotate-180" />
      <span className="h4">{resetTitle || 'Reset'}</span>
    </button>
  );

  return headerExtension;
};

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
    structuresMap,
    locale,
    dataQueries,
    dimensionCustomization,
    setDimensionKeyOrder,
    setDimensionKeyHidden,
  } = useTableSettingsContext();
  const dimensionsCtx = useDatasetDimensionsMetadataMapOptional();
  const renderLabel = useOtherColumnRenderLabel();

  const enrichItem = useMemo(() => {
    if (!dimensionsCtx || !structuresMap || !locale || !dataQueries?.length) {
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
    dimensionsCtx,
    structuresMap,
    locale,
    dataQueries,
    dimensionCustomization,
  ]);

  return gridApi ? (
    <AgGridColumnsPanel
      api={gridApi}
      enrichItem={enrichItem}
      renderLabel={renderLabel}
      onSubItemOrderChange={setDimensionKeyOrder}
      onSubItemVisibilityChange={setDimensionKeyHidden}
    />
  ) : null;
};
