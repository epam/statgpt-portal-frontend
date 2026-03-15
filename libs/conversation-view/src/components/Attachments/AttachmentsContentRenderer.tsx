'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC } from 'react';
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
} from '../../utils/attachments/attachment-parser';
import { AttachmentsStyles } from '../../models/attachments-styles';
import GridAttachment from './BaseAttachments/GridAttachment';
import CustomDataGridAttachment from './CustomAttachments/CustomGridAttachment';
import CustomChartAttachment from './CustomAttachments/CustomChartAttachment';
import { CodeAttachment } from './CustomAttachments/CodeAttachment';
import { AttachmentsActions } from '../../models/actions';
import { ConversationViewTitles } from '../../models/titles';

interface Props {
  selectedAttachment: Attachment;
  actions: AttachmentsActions;
  attachmentsStyles?: AttachmentsStyles;
  titles?: ConversationViewTitles;
  isDataLoading?: boolean;
  isOpenedAdvancedView?: boolean;
  onOpenAdvancedView?: () => void;
  showLimitMessage: (p: boolean) => void;
}

const AttachmentsContentRenderer: FC<Props> = ({
  selectedAttachment,
  actions,
  attachmentsStyles,
  titles,
  isDataLoading,
  isOpenedAdvancedView,
  onOpenAdvancedView,
  showLimitMessage,
}) => {
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
          showChartColumn={isOpenedAdvancedView}
          fixHeight={!isOpenedAdvancedView}
          titles={titles}
          showLimitMessage={showLimitMessage}
        />
      )}
      {isCustomChartAttachment(selectedAttachment) && (
        <CustomChartAttachment
          titles={titles}
          isDataLoading={isDataLoading}
          attachment={selectedAttachment}
          icons={attachmentsStyles?.chartingIcons}
          openAdvancedView={
            !isOpenedAdvancedView ? onOpenAdvancedView : void 0
          }
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
          className={
            attachmentsStyles?.codeAttachmentContainerClassName
          }
        />
      )}
    </div>
  );
};

export default AttachmentsContentRenderer;
