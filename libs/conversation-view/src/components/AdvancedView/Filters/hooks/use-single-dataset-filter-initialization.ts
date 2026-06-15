'use client';

import { DataConstraints } from '@epam/statgpt-sdmx-toolkit';
import { RefObject, useEffect, useRef } from 'react';
import { Filter, FiltersProps } from '../../../../models/filters';
import { getSingleDatasetFiltersPreselectedByDataQuery } from '../../../../utils/single-dataset-filters';

type SetFilters = (filters: Filter[]) => void;
type SetBooleanLoading = (isLoading: boolean) => void;

interface UseSingleDatasetFilterInitializationParams {
  dimensions?: FiltersProps['dimensions'];
  structureDimensions?: FiltersProps['structureDimensions'];
  structures?: FiltersProps['structures'];
  attachmentsDataQuery?: FiltersProps['attachmentsDataQuery'];
  locale?: string;
  constraintsRef: RefObject<DataConstraints[]>;
  setAppliedFilters: SetFilters;
  setIsConstraintsLoading: SetBooleanLoading;
  handleFiltersWithConstraints: (
    filters: Filter[],
    setFilters: SetFilters,
    setLoading?: SetBooleanLoading,
  ) => void;
}

export const useSingleDatasetFilterInitialization = ({
  dimensions,
  structureDimensions,
  structures,
  attachmentsDataQuery,
  locale,
  constraintsRef,
  setAppliedFilters,
  setIsConstraintsLoading,
  handleFiltersWithConstraints,
}: UseSingleDatasetFilterInitializationParams) => {
  const isPreselectedFromDataQuery = useRef(false);

  useEffect(() => {
    if (isPreselectedFromDataQuery.current || !structures) {
      return;
    }

    const filtersFromDataQuery = getSingleDatasetFiltersPreselectedByDataQuery({
      dimensions,
      structures,
      structureDimensions,
      locale,
      constraints: constraintsRef.current,
      dataQuery: attachmentsDataQuery,
    });

    setIsConstraintsLoading(true);
    handleFiltersWithConstraints(
      filtersFromDataQuery,
      setAppliedFilters,
      setIsConstraintsLoading,
    );
    isPreselectedFromDataQuery.current = true;
  }, [
    attachmentsDataQuery,
    constraintsRef,
    dimensions,
    handleFiltersWithConstraints,
    locale,
    setAppliedFilters,
    setIsConstraintsLoading,
    structureDimensions,
    structures,
  ]);
};
