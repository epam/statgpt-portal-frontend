'use client';

import { FC } from 'react';
import { StructureComponentValue } from '../../../models/structure-component';
import MetadataDescriptionItem from './MetadataDescriptionItem';
import MetadataItem from './MetadataItem';
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';

interface Props {
  metadata?: StructureComponentValue[];
  metadataDescription?: StructureComponentValue[];
  locale: string;
}

const MetadataContent: FC<Props> = ({
  metadata,
  metadataDescription = [],
  locale,
}) => {
  const { titles } = useConversationViewStyles();
  return (
    <div className="metadata-content h-full overflow-hidden">
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
      <div className="metadata-list h-full overflow-y-auto">
        {metadata && metadata?.length > 0 ? (
          metadata?.map((metadataItem) => (
            <MetadataItem
              key={metadataItem?.id || metadataItem?.title}
              title={metadataItem?.title}
              value={metadataItem?.value}
              locale={locale}
              attachedKeysTitles={metadataItem?.attachedKeysTitles}
              isDimensionGroup={metadataItem?.isDimensionGroup}
            />
          ))
        ) : (
          <div className="metadata-empty flex h-full items-center justify-center text-neutrals-700">
            {titles?.noMetadata || 'No metadata'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetadataContent;
