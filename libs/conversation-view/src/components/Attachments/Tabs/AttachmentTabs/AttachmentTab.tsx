'use client';

import {
  isChartAttachment,
  isCustomChartAttachment,
  isCustomGridAttachment,
  isMarkdownAttachment,
  isUrlAttachment,
} from '../../../../utils/attachments/attachment-parser';
import { Attachment } from '@epam/ai-dial-shared';
import ChartIcon from '../../../../assets/icons/chart.svg';
import CodeIcon from '../../../../assets/icons/code.svg';
import ColumnsIcon from '../../../../assets/icons/columns.svg';
import QueryIcon from '../../../../assets/icons/query.svg';
import classNames from 'classnames';
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip } from '../../../Tooltip/Tooltip';
import { ConversationViewTitles } from '../../../../models/titles';
import { getTooltipDataByElement } from '../../../../utils/get-tooltip-data.by-element';
import { useOnboarding } from '../../../../context/OnboardingContext';
import { OnboardingElements } from '../../../../constants/onboarding-elements';

interface Props {
  attachment: Attachment;
  index: number;
  selectedAttachmentIndex: number;
  openAdvancedViewIcon?: ReactNode;
  onSelectedAttachmentChange: (index: number) => void;
  showTabIcon?: boolean;
  dataGridTitle?: string;
  titles?: ConversationViewTitles;
}

const AttachmentTab: FC<Props> = ({
  attachment,
  index,
  selectedAttachmentIndex,
  onSelectedAttachmentChange,
  showTabIcon,
  dataGridTitle,
  titles,
}) => {
  const tabRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();

  const getTypeIcon = useCallback(
    (attachment: Attachment, className = '') => {
      if (!showTabIcon) {
        return null;
      }
      if (
        isChartAttachment(attachment) ||
        isCustomChartAttachment(attachment)
      ) {
        return <ChartIcon className={className} />;
      }

      if (isCustomGridAttachment(attachment)) {
        return <ColumnsIcon className={className} />;
      }

      if (isUrlAttachment(attachment)) {
        return <QueryIcon className={className} />;
      }

      if (isMarkdownAttachment(attachment)) {
        return <CodeIcon className={className} />;
      }

      return null;
    },
    [showTabIcon],
  );

  const getTabTitle = useCallback(
    (attachment: Attachment) => {
      if (isCustomGridAttachment(attachment)) {
        return dataGridTitle || 'Data Grid';
      }
      return attachment.title;
    },
    [dataGridTitle],
  );

  useEffect(() => {
    if (isShowOnboarding && isCustomChartAttachment(attachment)) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.CHARTS,
        titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [attachment, titles, isShowOnboarding]);

  useEffect(() => {
    if (isCustomChartAttachment(attachment) && isShowOnboarding) {
      const isCurrent =
        onboardingFileSchema?.lastDisplayedElement ===
        OnboardingElements.CHARTS;

      setIsTooltipVisible(isCurrent);

      if (isCurrent) {
        tabRef?.current?.scrollIntoView({
          block: 'end',
          behavior: 'smooth',
        });
      }
    }
  }, [
    onboardingFileSchema?.lastDisplayedElement,
    attachment,
    isShowOnboarding,
  ]);

  return (
    <div
      ref={tabRef}
      key={attachment.index || index}
      className={classNames(
        'cursor-pointer min-w-30',
        'flex items-center gap-1',
        'attachment-tab',
        selectedAttachmentIndex === index
          ? 'attachment-tab-active text-primary'
          : '',
      )}
      onClick={() => onSelectedAttachmentChange(index)}
    >
      {getTypeIcon(attachment, `w-4 h-4`)}
      <h4 className="truncate max-w-[130px]" title={getTabTitle(attachment)}>
        {getTabTitle(attachment)}
      </h4>
      {isTooltipVisible && (
        <Tooltip
          reference={tabRef}
          title={tooltipTitle}
          description={tooltipDescription}
        />
      )}
    </div>
  );
};

export default AttachmentTab;
