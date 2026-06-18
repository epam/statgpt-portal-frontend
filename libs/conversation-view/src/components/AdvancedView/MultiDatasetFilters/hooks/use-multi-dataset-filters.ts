'use client';

import { useDatasetDimensionsMetadataMapOptional } from '../../../../context/DatasetDimensionsMetadataMapContext';
import { FiltersProps } from '../../../../models/filters';
import { FiltersModalShellProps } from '../../Filters/FiltersModal/FiltersModalShell';
import { useFilters } from '../../Filters/hooks/use-filters';
import { useMultiFilterStrategy } from './use-multi-filter-strategy';

/**
 * Multi-dataset (cross-dataset) filter flow. Builds the multi-dataset strategy
 * and delegates orchestration to the shared {@link useFilters} hook.
 */
export const useMultiDatasetFilters = (
  props: FiltersProps,
): FiltersModalShellProps => {
  const datasetDimensionsMetadata = useDatasetDimensionsMetadataMapOptional();

  const strategy = useMultiFilterStrategy({
    actions: props.actions,
    dataQueries: props.dataQueries,
    datasetDimensionsMetadataMap: datasetDimensionsMetadata.map,
    structureDataMaps: props.structureDataMaps,
    datasetIcon: props.datasetIcon,
    locale: props.locale,
    onMultipleDataFiltersChange: props.onMultipleDataFiltersChange,
  });

  return useFilters(props, strategy);
};
