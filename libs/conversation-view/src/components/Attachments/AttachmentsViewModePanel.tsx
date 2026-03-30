'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC } from 'react';
import { Button, LimitMessages, CopyButton } from '@epam/statgpt-ui-components';
import {
  isCrossDatasetGrid,
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
import ColumnsIcon from '../../assets/icons/columns.svg';
import { useConversationViewFeatureToggles } from '../../context/ConversationViewFeatureTogglesContext';

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
  showAdvancedView?: boolean;
  isTableSettingsOpen?: boolean;
  onTableSettingsOpen?: () => void;
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
  showAdvancedView,
  isTableSettingsOpen,
  onTableSettingsOpen,
}) => {
  const { isTableSettingsFeatureEnabled } = useConversationViewFeatureToggles();

  const shouldShowColumnsButton =
    isTableSettingsFeatureEnabled &&
    !showAdvancedView &&
    !!onTableSettingsOpen &&
    !!(
      selectedAttachment &&
      (isCustomGridAttachment(selectedAttachment) ||
        isCrossDatasetGrid(selectedAttachment))
    );

  return (
    <div className="itms-center flex w-full min-w-0 justify-between">
      <AttachmentTabs
        dataGridTitle={attachmentsStyles?.dataGridTitle}
        attachments={attachments}
        selectedAttachmentIndex={selectedAttachmentIndex}
        showTabIcon={attachmentsStyles?.showTabIcon}
        onSelectedAttachmentChange={onSelectedAttachmentChange}
        titles={titles}
      />
      <div className="attachments-buttons flex w-fit flex-wrap items-center justify-end gap-x-3">
        {selectedAttachment &&
          isCustomGridAttachment(selectedAttachment) &&
          isExternaLinkIncludeFilters && (
            <a href={externalLink} target="_blank" rel="noreferrer">
              <Button
                title={limitMessages?.dataExplorer || 'Data explorer'}
                buttonClassName="text-button-tertiary small-icon-button [&>svg]:h-[16px] [&>svg]:w-[16px] whitespace-nowrap"
                iconBefore={limitMessages?.dataExplorerIcon}
              />
            </a>
          )}
        {shouldShowColumnsButton && (
          <Button
            disabled={isTableSettingsOpen}
            buttonClassName="text-button-tertiary !p-0 !h-6"
            textClassName="ml-1 h4"
            iconBefore={<ColumnsIcon className="size-4" />}
            title={attachmentsStyles?.columnsTitle || 'Columns'}
            onClick={onTableSettingsOpen}
          />
        )}
        {selectedAttachment && isCustomGridAttachment(selectedAttachment) && (
          <Button
            title={attachmentsStyles?.downloadTitle || 'Download'}
            buttonClassName="text-button-tertiary small-icon-button !p-0 !h-6"
            textClassName="ml-1"
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
                navigator.clipboard.writeText(selectedAttachment.data ?? '')
              }
            />
          )}
      </div>
    </div>
  );
};

export default AttachmentsViewModePanel;
