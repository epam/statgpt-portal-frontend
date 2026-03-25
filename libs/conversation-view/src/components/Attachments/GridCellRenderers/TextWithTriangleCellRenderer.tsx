'use client';

import { FC, useMemo, useCallback } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { StructuralData, getLastUpdatedTime } from '@epam/statgpt-sdmx-toolkit';
import SidePanelMetadataContent from '../../AdvancedView/Metadata/SidePanel/SidePanelMetadataContent';
import { getDatasetInfoData } from '../../../utils/attachments/metadata';
import { ConversationViewTitles } from '../../../models/titles';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewSidePanelOptional } from '../../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { getDateFormattedValue } from '../../../utils/date-format';

interface TextWithTriangleCellRendererParams extends ICellRendererParams {
  structuresMap: Map<string, StructuralData | undefined>;
  locale: string;
  titles?: ConversationViewTitles;
}

const METADATA_SIDE_PANEL_ID = 'text-with-triangle-metadata-side-panel';

const TextWithTriangleCellRenderer: FC<TextWithTriangleCellRendererParams> = (
  params,
) => {
  const { isOpenedAdvancedView } = useAdvancedView();
  const sidePanel = useConversationViewSidePanelOptional();
  const { isMetadataInSidePanel } = useConversationViewFeatureToggles();

  const urn: string | undefined = params?.data?.dataset?.urn;
  const structures = urn != null ? params.structuresMap.get(urn) : undefined;

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
      title: params.titles?.metadata || 'Metadata',
      bodyClassName: 'overflow-hidden',
      content: (
        <SidePanelMetadataContent
          titles={params.titles}
          locale={params.locale}
          metadata={[]}
          datasetInfo={datasetInfo}
        />
      ),
    });
  }, [
    sidePanel,
    isOpenedAdvancedView,
    datasetInfo,
    params.titles,
    params.locale,
  ]);

  return (
    <div className="w-full h-full p-2 relative">
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

export default TextWithTriangleCellRenderer;
