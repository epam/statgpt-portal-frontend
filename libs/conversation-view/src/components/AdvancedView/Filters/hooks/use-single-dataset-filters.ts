'use client';

import { FiltersProps } from '../../../../models/filters';
import { FiltersModalShellProps } from '../FiltersModal/FiltersModalShell';
import { useFilters } from './use-filters';
import { useSingleFilterStrategy } from './use-single-filter-strategy';

/**
 * Single-dataset (attachment-scoped) filter flow. Builds the single-dataset
 * strategy and delegates orchestration to the shared {@link useFilters} hook.
 */
export const useSingleDatasetFilters = (
  props: FiltersProps,
): FiltersModalShellProps => {
  const strategy = useSingleFilterStrategy({
    actions: props.actions,
    attachmentsDataQuery: props.attachmentsDataQuery,
    dataQueries: props.dataQueries,
    dimensions: props.dimensions,
    structureDimensions: props.structureDimensions,
    structures: props.structures,
    initialConstraints: props.initialConstraints,
    locale: props.locale,
    onFiltersChange: props.onFiltersChange,
  });

  return useFilters(props, strategy);
};
