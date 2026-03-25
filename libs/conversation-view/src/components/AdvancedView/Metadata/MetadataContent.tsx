'use client';

import { FC } from 'react';
import { StructureComponentValue } from '../../../models/structure-component';
import MetadataDescriptionItem from './MetadataDescriptionItem';
import MetadataItem from './MetadataItem';
import { ConversationViewTitles } from '../../../models/titles';

interface Props {
  metadata?: StructureComponentValue[];
  metadataDescription?: StructureComponentValue[];
  titles?: ConversationViewTitles;
  locale: string;
}

const MetadataContent: FC<Props> = ({
  metadata,
  metadataDescription = [],
  titles,
  locale,
}) => {
  return (
    <div className="metadata-content overflow-hidden h-full">
      {metadataDescription?.length > 0 && (
        <div className="metadata-description">
          {metadataDescription?.map((descriptionItem) => (
            <MetadataDescriptionItem
              key={descriptionItem?.title}
              title={descriptionItem?.title}
              value={descriptionItem?.value}
            />
          ))}
        </div>
      )}
      <div className="h-full overflow-y-auto metadata-list">
        {metadata && metadata?.length > 0 ? (
          metadata?.map((metadataItem) => (
            <MetadataItem
              key={metadataItem?.id || metadataItem?.title}
              title={metadataItem?.title}
              value={metadataItem?.value}
              locale={locale}
              attachedKeysTitles={metadataItem?.attachedKeysTitles}
            />
          ))
        ) : (
          <div className="metadata-empty text-neutrals-700 flex h-full justify-center items-center">
            {titles?.noMetadata || 'No metadata'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetadataContent;
