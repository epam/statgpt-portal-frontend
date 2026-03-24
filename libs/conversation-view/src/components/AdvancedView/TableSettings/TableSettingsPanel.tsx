import { IconRotate } from '@tabler/icons-react';
import { useCallback, useMemo } from 'react';
import { AgGridColumnsPanel } from './AgGridColumnPanel/AgGridColumnsPanel';
import {
  buildCrossDatasetEnrichItem,
  restoreInitialColumnsState,
} from './AgGridColumnPanel/helpers';
import { useTableSettingsContext } from './TableSettingsContext';
import { useDatasetDimensionsMetadataMapOptional } from '../../../context/DatasetDimensionsMetadataMapContext';

export const TABLE_SETTINGS_SIDE_PANEL_ID = 'table-settings-side-panel';

export const TableSettingsPanelHeaderExtension = ({
  resetTitle,
}: {
  resetTitle?: string;
}) => {
  const { gridApi, initialColumnsState } = useTableSettingsContext();

  const resetColumns = useCallback(() => {
    if (!gridApi) {
      return;
    }

    restoreInitialColumnsState(gridApi, initialColumnsState);
  }, [gridApi, initialColumnsState]);

  const headerExtension = (
    <button
      type="button"
      className="text-neutrals-800 flex gap-1 items-center"
      onClick={resetColumns}
    >
      <IconRotate className="rotate-180 size-4" />
      <span className="h4">{resetTitle || 'Reset'}</span>
    </button>
  );

  return headerExtension;
};

export const TableSettingsPanel = () => {
  const { gridApi, structuresMap, locale, dataQueries } =
    useTableSettingsContext();
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
    });
  }, [dimensionsCtx, structuresMap, locale, dataQueries]);

  return gridApi ? (
    <AgGridColumnsPanel api={gridApi} enrichItem={enrichItem} />
  ) : null;
};
