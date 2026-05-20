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
import CrossDatasetGridAttachment from './CustomAttachments/CrossDatasetGridAttachment';

interface Props {
  selectedAttachment: Attachment;
  actions: AttachmentsActions;
  attachmentsStyles?: AttachmentsStyles;
  isDataLoading?: boolean;
  externalLink?: string;
  externalLinksMap?: Map<string, string>;
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
  externalLinksMap,
  isOpenedAdvancedView,
  onOpenAdvancedView,
  showLimitMessage,
  onGridApiReady,
}) => {
  return (
    <div className="flex min-h-0 w-full flex-1 justify-center">
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
          onApiReady={onGridApiReady}
          externalLink={externalLink}
          externalLinksMap={externalLinksMap}
        />
      )}
      {isCustomChartAttachment(selectedAttachment) && (
        <CustomChartAttachment
          isDataLoading={isDataLoading}
          attachment={selectedAttachment}
          icons={attachmentsStyles?.chartingIcons}
          openAdvancedView={!isOpenedAdvancedView ? onOpenAdvancedView : void 0}
          fixHeight={!isOpenedAdvancedView}
          limitationInfoPrefixIcon={attachmentsStyles?.limitationInfoIcon}
          limitationInfoContentClassName={
            attachmentsStyles?.limitationInfoContentClassName
          }
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
