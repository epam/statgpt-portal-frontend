'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC, useState } from 'react';
import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { AttachmentsActions } from '@statgpt/conversation-view/src/models/actions';

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
      className={`border rounded-lg p-3 bg-white transition-colors ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="body-2 text-neutrals-800 truncate"
              title={attachment.title}
            >
              {attachment.title}
            </span>
          </div>
        </div>

        {fileUrl && (
          <div className="flex-shrink-0">
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
          <pre className="bg-white p-3 rounded-md overflow-x-auto">
            <code>{JSON.stringify(fileContent, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default FileAttachment;
