'use client';

import { Attachment } from '@epam/ai-dial-shared';
import classNames from 'classnames';
import { FC, useEffect, useRef, useState } from 'react';
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
import { IconSettings } from '@tabler/icons-react';
import { useConversationViewFeatureToggles } from '../../context/ConversationViewFeatureTogglesContext';
import { useAdvancedView } from '../../context/AdvancedViewContext';
import { useConversationViewStyles } from '../../context/ConversationViewStylesContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingElements } from '../../constants/onboarding-elements';
import { getTooltipDataByElement } from '../../utils/get-tooltip-data.by-element';
import { Tooltip } from '../Tooltip/Tooltip';

interface Props {
  attachments: (
    | Attachment
    | CustomGridAttachment
    | CustomChartAttachmentType
  )[];
  selectedAttachmentIndex: number;
  selectedAttachment: Attachment | null;
  attachmentsStyles?: AttachmentsStyles;
  externalLink?: string;
  isExternalLinkIncludeFilters?: boolean;
  limitMessages?: LimitMessages;
  onSelectedAttachmentChange: (index: number) => void;
  onDownloadClick: () => void;
  hideDownloadButton?: boolean;
  showAdvancedView?: boolean;
  onOpenAdvancedView?: () => void;
  isTableSettingsOpen?: boolean;
  onTableSettingsOpen?: () => void;
}

const AttachmentsViewModePanel: FC<Props> = ({
  attachments,
  selectedAttachmentIndex,
  selectedAttachment,
  attachmentsStyles,
  externalLink,
  isExternalLinkIncludeFilters,
  limitMessages,
  onSelectedAttachmentChange,
  onDownloadClick,
  hideDownloadButton,
  showAdvancedView,
  onOpenAdvancedView,
  isTableSettingsOpen,
  onTableSettingsOpen,
}) => {
  const { isTableSettingsFeatureEnabled } = useConversationViewFeatureToggles();
  const { isOpenedAdvancedView } = useAdvancedView();
  const { titles } = useConversationViewStyles();
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();

  const advancedViewButtonRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  useEffect(() => {
    if (isShowOnboarding) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.OPEN_ADVANCED_VIEW,
        titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [titles, isShowOnboarding]);

  useEffect(() => {
    if (isShowOnboarding) {
      const isCurrent =
        onboardingFileSchema?.lastDisplayedElement ===
        OnboardingElements.OPEN_ADVANCED_VIEW;
      setIsTooltipVisible(isCurrent);

      if (isCurrent) {
        advancedViewButtonRef?.current?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }
    }
  }, [onboardingFileSchema?.lastDisplayedElement, isShowOnboarding]);

  const shouldShowColumnsButton =
    isTableSettingsFeatureEnabled &&
    !showAdvancedView &&
    !!onTableSettingsOpen &&
    !!(
      selectedAttachment &&
      (isCustomGridAttachment(selectedAttachment) ||
        isCrossDatasetGrid(selectedAttachment))
    );

  const shouldShowDownloadButton =
    !hideDownloadButton &&
    !!selectedAttachment &&
    (isCustomGridAttachment(selectedAttachment) ||
      isCrossDatasetGrid(selectedAttachment));

  const shouldShowAdvancedViewButton =
    !!showAdvancedView && !isOpenedAdvancedView;

  const downloadIcon =
    isOpenedAdvancedView && attachmentsStyles?.hideDownloadIconInAdvancedView
      ? undefined
      : attachmentsStyles?.downloadIcon;

  const downloadTitle =
    !isOpenedAdvancedView &&
    attachmentsStyles?.hideDownloadTextInConversationView
      ? ''
      : (attachmentsStyles?.downloadTitle ?? '');

  return (
    <div className="flex w-full min-w-0 items-center justify-between">
      <AttachmentTabs
        dataGridTitle={attachmentsStyles?.dataGridTitle}
        attachments={attachments}
        selectedAttachmentIndex={selectedAttachmentIndex}
        showTabIcon={attachmentsStyles?.showTabIcon}
        onSelectedAttachmentChange={onSelectedAttachmentChange}
      />
      <div className="attachments-buttons flex w-fit flex-wrap items-center justify-end gap-x-3">
        {selectedAttachment &&
          isCustomGridAttachment(selectedAttachment) &&
          isExternalLinkIncludeFilters && (
            <a href={externalLink} target="_blank" rel="noreferrer">
              <Button
                title={limitMessages?.dataExplorer || 'Data explorer'}
                buttonClassName="text-button-tertiary small-icon-button [&>svg]:h-[16px] [&>svg]:w-[16px] whitespace-nowrap"
                iconBefore={limitMessages?.dataExplorerIcon}
              />
            </a>
          )}
        {shouldShowDownloadButton && (
          <Button
            title={downloadTitle}
            buttonClassName="text-button-tertiary small-icon-button !p-0 !h-6"
            textClassName={classNames(
              'ml-1',
              attachmentsStyles?.downloadButtonTextClassName,
            )}
            onClick={onDownloadClick}
            iconBefore={downloadIcon}
          />
        )}
        {shouldShowDownloadButton && shouldShowAdvancedViewButton && (
          <span className="advanced-view-button-divider" aria-hidden="true" />
        )}
        {shouldShowAdvancedViewButton && (
          <div ref={advancedViewButtonRef}>
            <Button
              title={attachmentsStyles?.advancedViewTitle}
              buttonClassName="advanced-view-button"
              textClassName="ml-1 h4 md:hidden"
              iconBefore={attachmentsStyles?.openAdvancedViewIcon}
              onClick={onOpenAdvancedView}
            />
          </div>
        )}
        {shouldShowColumnsButton && (
          <Button
            disabled={isTableSettingsOpen}
            buttonClassName="text-button-tertiary !p-0 !h-6"
            textClassName="ml-1 h4"
            iconBefore={
              attachmentsStyles?.tableSettingsIcon ?? (
                <IconSettings className="size-4" />
              )
            }
            title={attachmentsStyles?.tableSettings || 'Table settings'}
            onClick={onTableSettingsOpen}
          />
        )}
        {selectedAttachment &&
          isCustomCodeSampleAttachment(selectedAttachment) && (
            <CopyButton
              title={attachmentsStyles?.copyTitle}
              copiedTitle={attachmentsStyles?.copiedTitle}
              tooltip={attachmentsStyles?.copiedTooltip}
              hoverTooltip={attachmentsStyles?.copyHoverTooltip}
              icon={attachmentsStyles?.copyIcon}
              copiedIcon={attachmentsStyles?.copiedIcon}
              onClick={() =>
                navigator.clipboard.writeText(selectedAttachment.data ?? '')
              }
            />
          )}
      </div>
      {isTooltipVisible && (
        <Tooltip
          reference={advancedViewButtonRef}
          title={tooltipTitle}
          description={tooltipDescription}
          onReferenceClick={onOpenAdvancedView}
          shouldCloseTooltip={isOpenedAdvancedView}
        />
      )}
    </div>
  );
};

export default AttachmentsViewModePanel;
