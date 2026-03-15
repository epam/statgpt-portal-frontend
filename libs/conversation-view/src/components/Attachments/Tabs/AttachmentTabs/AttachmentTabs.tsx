'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC } from 'react';
import AttachmentTab from './AttachmentTab';

interface Props {
  attachments: Attachment[];
  selectedAttachmentIndex: number;
  showTabIcon?: boolean;
  dataGridTitle?: string;
  onSelectedAttachmentChange: (index: number) => void;
}

const AttachmentTabs: FC<Props> = ({ attachments, ...props }) => {
  return (
    <div className="flex items-center w-full flex-wrap attachments-tabs">
      {attachments.map((attachment, index) => (
        <AttachmentTab
          key={index}
          attachment={attachment}
          index={index}
          {...props}
        />
      ))}
    </div>
  );
};

export default AttachmentTabs;
