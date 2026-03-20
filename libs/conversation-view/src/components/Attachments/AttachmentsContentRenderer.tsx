'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC } from 'react';
import type { GridApi } from 'ag-grid-community';
import FileAttachment from './BaseAttachments/FileAttachment';
import MarkdownAttachment from './BaseAttachments/MarkdownAttachment';
import UrlAttachment from './BaseAttachments/UrlAttachment';
import {
  isCustomCodeSampleAttachment,
  isCustomChartAttachment,
  isCustomGridAttachment,
  isFileAttachment,
  isGridAttachment,
  isMarkdownAttachment,
  isUrlAttachment,
  isCrossDatasetGrid,
} from '../../utils/attachments/attachment-parser';
import { AttachmentsStyles } from '../../models/attachments-styles';
import GridAttachment from './BaseAttachments/GridAttachment';
import CustomDataGridAttachment from './CustomAttachments/CustomGridAttachment';
import CustomChartAttachment from './CustomAttachments/CustomChartAttachment';
import { CodeAttachment } from './CustomAttachments/CodeAttachment';
import { AttachmentsActions } from '../../models/actions';
import { useConversationViewTitles } from '../../context/ConversationViewTitlesContext';
import CrossDatasetGridAttachment from './CustomAttachments/CrossDatasetGridAttachment';

interface Props {
  selectedAttachment: Attachment;
  actions: AttachmentsActions;
  attachmentsStyles?: AttachmentsStyles;
  isDataLoading?: boolean;
  externalLink?: string;
  isOpenedAdvancedView?: boolean;
  onOpenAdvancedView?: () => void;
  showLimitMessage: (p: boolean) => void;
  onGridApiReady?: (api: GridApi) => void;
}

const AttachmentsContentRenderer: FC<Props> = ({
  selectedAttachment,
  actions,
  attachmentsStyles,
  isDataLoading,
  externalLink,
  isOpenedAdvancedView,
  onOpenAdvancedView,
  showLimitMessage,
  onGridApiReady,
}) => {
  const titles = useConversationViewTitles();
  return (
    <div className="flex flex-1 w-full justify-center min-h-0">
      {isFileAttachment(selectedAttachment) && (
        <FileAttachment
          actions={actions}
          downloadTitles={attachmentsStyles?.downloadTitle}
          attachment={selectedAttachment}
        />
      )}
      {isGridAttachment(selectedAttachment) && (
        <GridAttachment
          actions={actions}
          attachment={selectedAttachment}
          showLimitMessage={showLimitMessage}
        />
      )}
      {isCustomGridAttachment(selectedAttachment) && (
        <CustomDataGridAttachment
          attachment={selectedAttachment}
          isDataLoading={isDataLoading}
          isChartColumnVisible={isOpenedAdvancedView}
          fixHeight={!isOpenedAdvancedView}
          titles={titles}
          showLimitMessage={showLimitMessage}
          onApiReady={onGridApiReady}
          externalLink={externalLink}
        />
      )}
      {isCrossDatasetGrid(selectedAttachment) && (
        <CrossDatasetGridAttachment
          attachment={selectedAttachment}
          isDataLoading={isDataLoading}
          isChartColumnVisible={isOpenedAdvancedView}
          fixHeight={!isOpenedAdvancedView}
          showLimitMessage={showLimitMessage}
        />
      )}
      {isCustomChartAttachment(selectedAttachment) && (
        <CustomChartAttachment
          titles={titles}
          isDataLoading={isDataLoading}
          attachment={selectedAttachment}
          icons={attachmentsStyles?.chartingIcons}
          openAdvancedView={!isOpenedAdvancedView ? onOpenAdvancedView : void 0}
          fixHeight={!isOpenedAdvancedView}
        />
      )}
      {isUrlAttachment(selectedAttachment) && (
        <UrlAttachment
          attachment={selectedAttachment}
          openLinkTitle={attachmentsStyles?.openLinkTitle}
        />
      )}
      {isMarkdownAttachment(selectedAttachment) && (
        <MarkdownAttachment attachment={selectedAttachment} />
      )}
      {isCustomCodeSampleAttachment(selectedAttachment) && (
        <CodeAttachment
          attachment={selectedAttachment}
          className={attachmentsStyles?.codeAttachmentContainerClassName}
        />
      )}
    </div>
  );
};

export default AttachmentsContentRenderer;
