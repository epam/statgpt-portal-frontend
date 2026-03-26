'use client';

import { FC, useCallback } from 'react';
import { StructureComponentValue } from '../../../models/structure-component';

const MetadataDescriptionItem: FC<StructureComponentValue> = ({
  title,
  value,
}) => {
  const getMetadataDescriptionValue = useCallback(
    () => (Array.isArray(value) ? value.join(', ') : value),
    [value],
  );

  return (
    <div className="body-3 flex gap-x-3">
      <p title={title} className="text-neutrals-800">
        {title}:
      </p>
      <p
        title={getMetadataDescriptionValue()}
        className="truncate pr-3 font-semibold"
      >
        {getMetadataDescriptionValue()}
      </p>
    </div>
  );
};

export default MetadataDescriptionItem;
