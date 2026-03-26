'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC, useState } from 'react';
import { Button } from '@epam/statgpt-ui-components';
import { AttachmentsActions } from '../../../models/actions';

interface Props {
  attachment: Attachment;
  className?: string;
  downloadTitles?: string;
  actions: AttachmentsActions;
}

const FileAttachment: FC<Props> = ({
  downloadTitles,
  attachment,
  actions,
  className = '',
}) => {
  const fileUrl = attachment.url;
  const [fileContent, setFileContent] = useState<object | null>(null);

  async function downloadAttachment(attachmentUrl?: string) {
    if (attachmentUrl == null) {
      return;
    }
    const file = await actions.getFile(attachmentUrl);
    setFileContent(file);
  }

  return (
    <div
      className={`rounded-lg border bg-white p-3 transition-colors ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="body-2 truncate text-neutrals-800"
              title={attachment.title}
            >
              {attachment.title}
            </span>
          </div>
        </div>

        {fileUrl && (
          <div className="shrink-0">
            <Button
              title={downloadTitles ?? 'Download'}
              onClick={() => downloadAttachment(attachment.url)}
              buttonClassName="text-button-tertiary"
            />
          </div>
        )}
      </div>
      {fileContent && (
        <div className="mt-3">
          <pre className="overflow-x-auto rounded-md bg-white p-3">
            <code>{JSON.stringify(fileContent, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default FileAttachment;
