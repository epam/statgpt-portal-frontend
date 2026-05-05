import { FC, useCallback, useState } from 'react';

import Metadata from '../../AdvancedView/Metadata/Metadata';
import SidePanelMetadataContent from '../../AdvancedView/Metadata/SidePanel/SidePanelMetadataContent';
import { getExternalLinkFromContext } from './helpers/get-external-link-from-context';
import { getObsAttributesFromParams } from '../../../utils/attachments/metadata';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewSidePanelOptional } from '../../ConversationView/SidePanel/ConversationViewSidePanelContext';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import {
  getObservationMetadataContent,
  ObservationMetadataContent,
  ObservationValueCellRendererParams,
} from './helpers/get-observation-metadata-content';

const METADATA_SIDE_PANEL_ID = 'observation-metadata-side-panel';

interface ObservationValueCellWithMetadataProps {
  params: ObservationValueCellRendererParams;
  obsAttributes: NonNullable<ReturnType<typeof getObsAttributesFromParams>>;
}

const ObservationValueCellWithMetadata: FC<
  ObservationValueCellWithMetadataProps
> = ({ params, obsAttributes }) => {
  const [metadataContent, setMetadataContent] =
    useState<ObservationMetadataContent | null>(null);
  const { isOpenedAdvancedView } = useAdvancedView();
  const sidePanel = useConversationViewSidePanelOptional();
  const { isMetadataInSidePanel } = useConversationViewFeatureToggles();
  const rowUrn = params?.data?.dataset?.urn as string | undefined;
  const externalLink = getExternalLinkFromContext(params?.context, rowUrn);

  const openMetadata = useCallback(() => {
    const content = getObservationMetadataContent(params, obsAttributes);

    if (isMetadataInSidePanel && sidePanel) {
      sidePanel.openPanel({
        id: METADATA_SIDE_PANEL_ID,
        scope: isOpenedAdvancedView ? 'advanced' : 'conversation',
        title: params.titles?.metadata || 'Metadata',
        bodyClassName: 'overflow-hidden',
        content: (
          <SidePanelMetadataContent
            titles={params.titles}
            locale={params?.locale}
            metadata={content.metadata}
            datasetInfo={content.sidePanelDatasetInfo}
            externalLink={externalLink}
            metadataDescription={content.metadataDescription}
          />
        ),
      });

      return;
    }

    setMetadataContent(content);
  }, [
    isMetadataInSidePanel,
    isOpenedAdvancedView,
    externalLink,
    obsAttributes,
    params,
    sidePanel,
  ]);

  const closeMetadata = useCallback(() => {
    setMetadataContent(null);
  }, []);

  return (
    <>
      <div className="relative size-full p-2 text-end">
        {params?.valueFormatted || params?.value}
        <div
          className="metadata-indicator"
          title={params.titles?.metadata || 'View details'}
          onClick={openMetadata}
        ></div>
      </div>
      {metadataContent && (
        <Metadata
          titles={params.titles}
          locale={params?.locale}
          metadata={metadataContent.metadata}
          metadataDescription={metadataContent.metadataDescription}
          isOpenMetadata
          onCloseMetadata={closeMetadata}
        />
      )}
    </>
  );
};

export default ObservationValueCellWithMetadata;
