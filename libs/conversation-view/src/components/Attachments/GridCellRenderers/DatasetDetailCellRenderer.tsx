'use client';

import { FC, useMemo, useCallback } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import {
  Data,
  getLastUpdatedTime,
  getStructureComponentsMap,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import SidePanelMetadataContent from '../../AdvancedView/Metadata/SidePanel/SidePanelMetadataContent';
import {
  getDataSetAttributes,
  getDatasetInfoData,
  getStructureAttributes,
} from '../../../utils/attachments/metadata';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';
import { useConversationViewSidePanelOptional } from '../../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { getDateFormattedValue } from '../../../utils/date-format';
import { getExternalLinkFromContext } from './helpers/get-external-link-from-context';

interface DatasetDetailCellRendererParams extends ICellRendererParams {
  structuresMap: Map<string, StructuralData | undefined>;
  attributesDataMap: Map<string, Data | undefined>;
  locale: string;
}

const METADATA_SIDE_PANEL_ID = 'dataset-detail-metadata-side-panel';

const DatasetDetailCellRenderer: FC<DatasetDetailCellRendererParams> = (
  params,
) => {
  const { titles } = useConversationViewStyles();
  const { isOpenedAdvancedView } = useAdvancedView();
  const sidePanel = useConversationViewSidePanelOptional();
  const { isMetadataInSidePanel } = useConversationViewFeatureToggles();

  const urn: string | undefined = params?.data?.dataset?.urn;
  const externalLink = getExternalLinkFromContext(params?.context, urn);
  const structures = urn != null ? params.structuresMap.get(urn) : undefined;
  const resolvedData =
    urn != null ? params.attributesDataMap?.get(urn) : undefined;

  const datasetInfo = useMemo(() => {
    const dataflow = structures?.dataflows?.[0];
    if (!dataflow) return undefined;
    const lastUpdatedDate = getDateFormattedValue(
      getLastUpdatedTime(dataflow),
      params.locale,
    );
    return getDatasetInfoData(dataflow, lastUpdatedDate, params.locale, titles);
  }, [structures, params.locale, titles]);

  const metadata = useMemo(
    () =>
      getDataSetAttributes(
        getStructureAttributes(resolvedData),
        getStructureComponentsMap(structures),
        params.locale,
      ),
    [resolvedData, structures, params.locale],
  );

  const showIndicator = isMetadataInSidePanel && !!sidePanel && !!params.value;

  const openMetadata = useCallback(() => {
    if (!sidePanel) return;
    sidePanel.openPanel({
      id: METADATA_SIDE_PANEL_ID,
      scope: isOpenedAdvancedView ? 'advanced' : 'conversation',
      title: titles?.datasetMetadataPanel || 'Dataset Metadata',
      bodyClassName: 'overflow-hidden',
      content: (
        <SidePanelMetadataContent
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
    metadata,
    datasetInfo,
    externalLink,
    titles,
    params.locale,
  ]);

  return (
    <div className="relative size-full p-2">
      {params.valueFormatted ?? params.value}
      {showIndicator && (
        <div
          className="metadata-indicator"
          title={titles?.metadata || 'View details'}
          onClick={openMetadata}
        />
      )}
    </div>
  );
};

export default DatasetDetailCellRenderer;
