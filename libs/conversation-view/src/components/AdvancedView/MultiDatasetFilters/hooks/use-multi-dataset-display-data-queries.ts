'use client';

import { generateShortUrn, getLocalizedName } from '@epam/statgpt-sdmx-toolkit';
import { useMemo } from 'react';
import { FiltersProps } from '../../../../models/filters';
import { StructureDataMaps } from '../../../../models/structure-data';

export const useMultiDatasetDisplayDataQueries = (
  dataQueries?: FiltersProps['dataQueries'],
  structuresMap?: StructureDataMaps['structuresMap'],
  locale?: string,
) =>
  useMemo(
    () =>
      dataQueries?.map((q) => {
        const dataflow = structuresMap?.get(q.urn)?.dataflows?.[0];
        const localizedName = getLocalizedName(dataflow, locale ?? '');
        const name = localizedName
          ? generateShortUrn(localizedName, '', dataflow?.agencyID)
          : undefined;
        return name ? { ...q, title: name } : q;
      }),
    [dataQueries, locale, structuresMap],
  );
