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
import { FC, ReactNode, useCallback } from 'react';

interface Props {
  attachment: Attachment;
  index: number;
  selectedAttachmentIndex: number;
  openAdvancedViewIcon?: ReactNode;
  onSelectedAttachmentChange: (index: number) => void;
  showTabIcon?: boolean;
  dataGridTitle?: string;
}

const AttachmentTab: FC<Props> = ({
  attachment,
  index,
  selectedAttachmentIndex,
  onSelectedAttachmentChange,
  showTabIcon,
  dataGridTitle,
}) => {
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

  return (
    <div
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
    </div>
  );
};

export default AttachmentTab;
