'use client';

import { Attachment } from '@epam/ai-dial-shared';
import { FC } from 'react';
import { sanitizeUrl } from '../../../utils/attachments/attachment-utils';
import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { Link } from '@statgpt/ui-components/src/components/Link/Link';
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
      className={`border rounded-lg bg-white pl-4 py-3 pr-3 max-w-[500px] ${className}`}
    >
      <div className="flex items-start gap-2">
        <span
          className="text-hues-800 flex-shrink-0 mt-1"
          role="img"
          aria-label="Link"
        >
          <LinkIcon width={16} height={16} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="mb-1">
            <Link url={url} title={attachment.title} />
          </div>

          <div className="text-neutrals-600 break-all truncate">{url}</div>
        </div>

        <div className="flex-shrink-0">
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
