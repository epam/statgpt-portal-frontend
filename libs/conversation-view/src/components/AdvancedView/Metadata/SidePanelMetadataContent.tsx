'use client';

import { FC, useCallback } from 'react';
import { StructureComponentValue } from '../../../models/structure-component';
import { ConversationViewTitles } from '../../../models/titles';

interface Props {
  metadata?: StructureComponentValue[];
  metadataDescription?: StructureComponentValue[];
  titles?: ConversationViewTitles;
  locale: string;
}

const SidePanelMetadataContent: FC<Props> = ({
  metadata,
  metadataDescription = [],
  titles,
  locale,
}) => {
  const formatValue = useCallback(
    (value: StructureComponentValue['value']) => {
      if (Array.isArray(value)) {
        return value
          .map((valueItem) =>
            typeof valueItem === 'object'
              ? (valueItem?.[locale] ?? '')
              : valueItem,
          )
          .join(', ');
      }

      if (typeof value === 'object' && value !== null) {
        return value?.[locale] ?? '';
      }

      return value ?? '';
    },
    [locale],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden px-5 py-4">
      {metadataDescription.length > 0 && (
        <div className="mb-8 flex flex-col gap-2">
          {metadataDescription.map((descriptionItem) => (
            <div key={descriptionItem?.title} className="flex gap-2 body-3">
              <span className="shrink-0 text-neutrals-800">
                {descriptionItem?.title}:
              </span>
              <span className="min-w-0 truncate font-semibold text-neutrals-1000">
                {formatValue(descriptionItem?.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {metadata?.length ? (
          <div className="flex flex-col gap-4">
            {metadata.map((metadataItem) => (
              <div
                key={metadataItem?.id || metadataItem?.title}
                className="flex flex-col gap-1"
              >
                {metadataItem?.attachedKeysTitles?.map((attachedKeyTitle) => (
                  <div
                    key={attachedKeyTitle}
                    title={attachedKeyTitle}
                    className="body-3 text-neutrals-800"
                  >
                    {attachedKeyTitle}
                  </div>
                ))}
                <p
                  title={metadataItem?.title}
                  className="body-3 text-neutrals-800"
                >
                  {metadataItem?.title}
                </p>
                <p
                  title={formatValue(metadataItem?.value)}
                  className="body-2 break-words text-neutrals-1000"
                >
                  {formatValue(metadataItem?.value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-neutrals-700 body-3">
            {titles?.noMetadata || 'No metadata'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanelMetadataContent;
