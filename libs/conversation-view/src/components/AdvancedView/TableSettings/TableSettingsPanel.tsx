import { IconRotate } from '@tabler/icons-react';
import { useCallback, useMemo } from 'react';
import { AgGridColumnsPanel } from './AgGridColumnPanel/AgGridColumnsPanel';
import { buildCrossDatasetEnrichItem } from './helpers/crossDatasetEnrichment';
import { restoreInitialColumnsState } from './AgGridColumnPanel/helpers/columnStateSnapshot';
import { useTableSettingsContext } from './TableSettingsContext';
import { useDatasetDimensionsMetadataMapOptional } from '../../../context/DatasetDimensionsMetadataMapContext';

export const TABLE_SETTINGS_SIDE_PANEL_ID = 'table-settings-side-panel';

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
  }, [dimensionsCtx, structuresMap, locale, dataQueries, dimensionCustomization]);

  return gridApi ? (
    <AgGridColumnsPanel
      api={gridApi}
      enrichItem={enrichItem}
      onSubItemOrderChange={setDimensionKeyOrder}
      onSubItemVisibilityChange={setDimensionKeyHidden}
    />
  ) : null;
};
