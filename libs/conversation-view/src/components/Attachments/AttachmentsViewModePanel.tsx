'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC } from 'react';
import {
  Button,
  LimitMessages,
  CopyButton,
} from '@epam/statgpt-ui-components';
import {
  isCustomCodeSampleAttachment,
  isCustomGridAttachment,
} from '../../utils/attachments/attachment-parser';
import {
  CustomChartAttachmentType,
  CustomGridAttachment,
} from '../../models/attachments';
import AttachmentTabs from './Tabs/AttachmentTabs/AttachmentTabs';
import { AttachmentsStyles } from '../../models/attachments-styles';
import { ConversationViewTitles } from '../../models/titles';

interface Props {
  attachments: (
    | Attachment
    | CustomGridAttachment
    | CustomChartAttachmentType
  )[];
  selectedAttachmentIndex: number;
  selectedAttachment: Attachment | null;
  attachmentsStyles?: AttachmentsStyles;
  titles?: ConversationViewTitles;
  externalLink?: string;
  isExternaLinkIncludeFilters?: boolean;
  limitMessages?: LimitMessages;
  onSelectedAttachmentChange: (index: number) => void;
  onDownloadClick: () => void;
}

const AttachmentsViewModePanel: FC<Props> = ({
  attachments,
  selectedAttachmentIndex,
  selectedAttachment,
  attachmentsStyles,
  titles,
  externalLink,
  isExternaLinkIncludeFilters,
  limitMessages,
  onSelectedAttachmentChange,
  onDownloadClick,
}) => {
  return (
    <div className="flex min-w-0 w-full justify-between itms-center">
      <AttachmentTabs
        dataGridTitle={attachmentsStyles?.dataGridTitle}
        attachments={attachments}
        selectedAttachmentIndex={selectedAttachmentIndex}
        showTabIcon={attachmentsStyles?.showTabIcon}
        onSelectedAttachmentChange={onSelectedAttachmentChange}
        titles={titles}
      />
      <div className="flex gap-x-3 items-center flex-wrap w-fit justify-end">
        {selectedAttachment &&
          isCustomGridAttachment(selectedAttachment) &&
          isExternaLinkIncludeFilters && (
            <a href={externalLink} target="_blank">
              <Button
                title={limitMessages?.dataExplorer || 'Data explorer'}
                buttonClassName="text-button-tertiary small-icon-button [&>svg]:h-[16px] [&>svg]:w-[16px] whitespace-nowrap"
                iconBefore={limitMessages?.dataExplorerIcon}
              />
            </a>
          )}
        {selectedAttachment &&
          isCustomGridAttachment(selectedAttachment) && (
            <Button
              title={attachmentsStyles?.downloadTitle || 'Download'}
              buttonClassName="text-button-tertiary small-icon-button"
              onClick={onDownloadClick}
              iconBefore={attachmentsStyles?.downloadIcon}
            />
          )}
        {selectedAttachment &&
          isCustomCodeSampleAttachment(selectedAttachment) && (
            <CopyButton
              title={attachmentsStyles?.copyTitle}
              copiedTitle={attachmentsStyles?.copiedTitle}
              tooltip={attachmentsStyles?.copiedTooltip}
              icon={attachmentsStyles?.copyIcon}
              copiedIcon={attachmentsStyles?.copiedIcon}
              onClick={() =>
                navigator.clipboard.writeText(
                  selectedAttachment.data ?? '',
                )
              }
            />
          )}
      </div>
    </div>
  );
};

export default AttachmentsViewModePanel;
