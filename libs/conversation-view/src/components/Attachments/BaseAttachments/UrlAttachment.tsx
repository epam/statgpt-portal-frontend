'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC } from 'react';
import { sanitizeUrl } from '../../../utils/attachments/attachment-utils';
import { Button, Link } from '@epam/statgpt-ui-components';
import LinkIcon from '../../../assets/icons/link.svg';

interface Props {
  attachment: Attachment;
  className?: string;
  openLinkTitle?: string;
}

const UrlAttachment: FC<Props> = ({
  attachment,
  openLinkTitle,
  className = '',
}) => {
  const url = sanitizeUrl(attachment.data || '');

  if (!url) return null;

  const openUrl = (url: string) => {
    const newWindow = window.open(url, '_blank');
    newWindow?.focus();
  };

  return (
    <div
      className={`max-w-[500px] rounded-lg border bg-white py-3 pl-4 pr-3 ${className}`}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 shrink-0 text-hues-800"
          role="img"
          aria-label="Link"
        >
          <LinkIcon width={16} height={16} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <Link url={url} title={attachment.title} />
          </div>

          <div className="truncate break-all text-neutrals-600">{url}</div>
        </div>

        <div className="shrink-0">
          <Button
            title={openLinkTitle ?? 'Open link'}
            onClick={() => openUrl(url)}
            buttonClassName="text-button-tertiary"
          />
        </div>
      </div>
    </div>
  );
};

export default UrlAttachment;
