'use client';

import { FC, useMemo, useCallback } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import {
  DatasetDimensionsScheme,
  StructuralData,
  getStructureComponentsMap,
  getLastUpdatedTime,
} from '@epam/statgpt-sdmx-toolkit';
import SidePanelMetadataContent from '../../AdvancedView/Metadata/SidePanel/SidePanelMetadataContent';
import {
  getDatasetInfoData,
  getStructureComponentsValues,
} from '../../../utils/attachments/metadata';
import { ConversationViewTitles } from '../../../models/titles';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewSidePanelOptional } from '../../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { getDateFormattedValue } from '../../../utils/date-format';
import {
  COUNTRY_COL_ID,
  FREQUENCY_COL_ID,
  INDICATOR_COL_ID,
} from '../../../constants/cross-dataset-grid';

interface MergedDimensionCellRendererParams extends ICellRendererParams {
  structuresMap: Map<string, StructuralData | undefined>;
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>;
  colId: string;
  locale: string;
  titles?: ConversationViewTitles;
}

function getDimKeysForColumn(
  colId: string,
  scheme: DatasetDimensionsScheme,
): string[] {
  if (colId === INDICATOR_COL_ID) return scheme.indicators ?? [];
  if (colId === COUNTRY_COL_ID) return scheme.region ? [scheme.region] : [];
  if (colId === FREQUENCY_COL_ID)
    return scheme.frequency ? [scheme.frequency] : [];
  return [];
}

function getPanelTitle(colId: string, titles?: ConversationViewTitles): string {
  if (colId === INDICATOR_COL_ID)
    return titles?.indicatorMetadataPanel || 'Indicator dimension details';
  if (colId === COUNTRY_COL_ID)
    return titles?.countryMetadataPanel || 'Country dimension details';
  return titles?.metadata || 'Metadata';
}

const METADATA_SIDE_PANEL_ID = 'merged-dimension-metadata-side-panel';

const MergedDimensionCellRenderer: FC<MergedDimensionCellRendererParams> = (
  params,
) => {
  const { isOpenedAdvancedView } = useAdvancedView();
  const sidePanel = useConversationViewSidePanelOptional();
  const { isMetadataInSidePanel } = useConversationViewFeatureToggles();

  const urn: string | undefined = params?.data?.dataset?.urn;
  const structures = urn != null ? params.structuresMap.get(urn) : undefined;
  const scheme =
    urn != null ? params.datasetDimensionsSchemesMap.get(urn) : undefined;

  const metadata = useMemo(() => {
    if (!structures || !scheme) return [];
    const dimKeys = getDimKeysForColumn(params.colId, scheme);
    const structureComponentsMap = getStructureComponentsMap(structures);
    const components = dimKeys
      .filter((key) => params.data[key] != null)
      .map((key) => ({ name: key, value: String(params.data[key]) }));
    return getStructureComponentsValues(
      components,
      structureComponentsMap,
      params.locale,
    );
  }, [structures, scheme, params.colId, params.data, params.locale]);

  const datasetInfo = useMemo(() => {
    const dataflow = structures?.dataflows?.[0];
    if (!dataflow) return undefined;
    const lastUpdatedDate = getDateFormattedValue(
      getLastUpdatedTime(dataflow),
      params.locale,
    );
    return getDatasetInfoData(
      dataflow,
      lastUpdatedDate,
      params.locale,
      params.titles,
    );
  }, [structures, params.locale, params.titles]);

  const showTriangle = isMetadataInSidePanel && !!sidePanel && !!params.value;

  const openMetadata = useCallback(() => {
    if (!sidePanel) return;
    sidePanel.openPanel({
      id: METADATA_SIDE_PANEL_ID,
      scope: isOpenedAdvancedView ? 'advanced' : 'conversation',
      title: getPanelTitle(params.colId, params.titles),
      bodyClassName: 'overflow-hidden',
      content: (
        <SidePanelMetadataContent
          titles={params.titles}
          locale={params.locale}
          metadata={metadata}
          datasetInfo={datasetInfo}
        />
      ),
    });
  }, [
    sidePanel,
    isOpenedAdvancedView,
    metadata,
    datasetInfo,
    params.titles,
    params.locale,
  ]);

  return (
    <div className="relative size-full p-2">
      {params.valueFormatted ?? params.value}
      {showTriangle && (
        <div
          className="metadata-indicator"
          title={params.titles?.metadata || 'View details'}
          onClick={openMetadata}
        />
      )}
    </div>
  );
};

export default MergedDimensionCellRenderer;
