'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC } from 'react';
import { prepareMarkdownContent } from '../../../utils/attachments/markdown-validator';

interface Props {
  attachment: Attachment;
  className?: string;
}

const MarkdownAttachment: FC<Props> = ({ attachment, className = '' }) => {
  const contentString = prepareMarkdownContent(attachment.data);

  if (!contentString) return null;

  return (
    <div className={`attachment-json border rounded-lg bg-white ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutrals-200 bg-neutrals-100 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="text-neutrals-900">{attachment.title}</h3>
        </div>
      </div>

      <div className="p-3">
        <pre className="text-neutrals-800 overflow-x-auto whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
          <code>{contentString}</code>
        </pre>
      </div>
    </div>
  );
};

export default MarkdownAttachment;
