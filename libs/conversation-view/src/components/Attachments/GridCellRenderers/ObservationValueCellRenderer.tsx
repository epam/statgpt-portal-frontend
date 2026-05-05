'use client';

import { FC } from 'react';

import { getObsAttributesFromParams } from '../../../utils/attachments/metadata';
import { ObservationValueCellRendererParams } from './helpers/get-observation-metadata-content';
import ObservationValueCellWithMetadata from './ObservationValueCellWithMetadata';

const ObservationValueCellRenderer: FC<ObservationValueCellRendererParams> = (
  params: ObservationValueCellRendererParams,
) => {
  const obsAttributes = getObsAttributesFromParams(params);

  if (!obsAttributes?.length) {
    return (
      <div className="relative size-full p-2 text-end">
        {params?.valueFormatted || params?.value}
      </div>
    );
  }

  return (
    <ObservationValueCellWithMetadata
      params={params}
      obsAttributes={obsAttributes}
    />
  );
};

export default ObservationValueCellRenderer;
