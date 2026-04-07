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
  INDICATORS_CONCATENATION_SYMBOL,
} from '../../../constants/cross-dataset-grid';
import { useTableSettingsContextOptional } from '../../AdvancedView/TableSettings/TableSettingsContext';
import { getDimensionValue } from '../../../utils/attachments/cross-dataset-grid/dimensions-columns';
import { applyDimensionKeyCustomization } from '../../AdvancedView/TableSettings/helpers/crossDatasetEnrichment';
import { getExternalLinkFromContext } from './helpers/get-external-link-from-context';

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
  if (scheme.other?.includes(colId)) return [colId];
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
  const tableSettings = useTableSettingsContextOptional();

  const urn: string | undefined = params?.data?.dataset?.urn;
  const externalLink = getExternalLinkFromContext(params?.context, urn);
  const structures = urn != null ? params.structuresMap.get(urn) : undefined;
  const scheme =
    urn != null ? params.datasetDimensionsSchemesMap.get(urn) : undefined;

  const dimensionCustomization = tableSettings?.dimensionCustomization;

  const displayValue = useMemo(() => {
    if (!structures || !scheme || urn == null) {
      return params.valueFormatted ?? params.value;
    }
    const custom = dimensionCustomization?.get(urn)?.get(params.colId);
    const dimensionKeys = applyDimensionKeyCustomization(
      getDimKeysForColumn(params.colId, scheme),
      custom,
    );
    const names = dimensionKeys
      .map((k) => getDimensionValue(structures, k, params.data, params.locale))
      .filter(Boolean);
    return names.join(INDICATORS_CONCATENATION_SYMBOL);
  }, [
    dimensionCustomization,
    structures,
    scheme,
    urn,
    params.valueFormatted,
    params.value,
    params.colId,
    params.data,
    params.locale,
  ]);

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

  const showTriangle =
    isMetadataInSidePanel &&
    !!sidePanel &&
    !!params.value &&
    ![FREQUENCY_COL_ID, COUNTRY_COL_ID].includes(params.colId);

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
          externalLink={externalLink}
        />
      ),
    });
  }, [
    sidePanel,
    isOpenedAdvancedView,
    params.colId,
    params.titles,
    params.locale,
    metadata,
    datasetInfo,
    externalLink,
  ]);

  return (
    <div className="relative size-full p-2">
      {displayValue}
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
