'use client';

import { DatasetDimensionsMetadataMap } from '@epam/statgpt-sdmx-toolkit';
import { QueryFilterType } from '@epam/statgpt-shared-toolkit';
import { useEffect } from 'react';
import { Filter, FiltersProps } from '../../../../models/filters';
import { StructureDataMaps } from '../../../../models/structure-data';
import {
  getFilledDatasetFiltersMap,
  getFiltersPreselectedByDataQueries,
} from '../../../../utils/multiple-filters';

type SetFilters = (filters: Filter[]) => void;
type SetBooleanLoading = (isLoading: boolean) => void;

interface UseMultiDatasetFilterInitializationParams {
  dataQueries?: FiltersProps['dataQueries'];
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap;
  isStructureDataReady: boolean;
  locale?: string;
  structureDataMaps?: StructureDataMaps;
  setAppliedFilters: SetFilters;
  setIsConstraintsLoading: SetBooleanLoading;
  handleFiltersWithConstraints: (
    filters: Filter[],
    setFilters: SetFilters,
    setLoading?: SetBooleanLoading,
  ) => void;
}

export const useMultiDatasetFilterInitialization = ({
  dataQueries,
  datasetDimensionsMetadataMap,
  isStructureDataReady,
  locale,
  structureDataMaps,
  setAppliedFilters,
  setIsConstraintsLoading,
  handleFiltersWithConstraints,
}: UseMultiDatasetFilterInitializationParams) => {
  useEffect(() => {
    if (!isStructureDataReady) {
      setIsConstraintsLoading(true);
      return;
    }

    const filledDatasetFiltersMap = getFilledDatasetFiltersMap(
      structureDataMaps,
      locale,
    );
    const dataQueriesForMerge = dataQueries?.map((q) => {
      if (!q.disabled) return q;
      const emptySelectionFilters = (filledDatasetFiltersMap.get(q.urn) ?? [])
        .filter((f) => f.filterType === 'dataset' && f.id && !f.isTimeDimension)
        .map((f) => ({
          componentCode: f.id!,
          operator: QueryFilterType.IN,
          values: [] as string[],
        }));
      return { ...q, filters: emptySelectionFilters };
    });
    const filtersFromDataQuery = getFiltersPreselectedByDataQueries(
      filledDatasetFiltersMap,
      dataQueriesForMerge,
      structureDataMaps?.constraintsMap,
      datasetDimensionsMetadataMap,
    );
    setIsConstraintsLoading(true);
    handleFiltersWithConstraints(
      filtersFromDataQuery,
      setAppliedFilters,
      setIsConstraintsLoading,
    );
  }, [
    dataQueries,
    datasetDimensionsMetadataMap,
    handleFiltersWithConstraints,
    isStructureDataReady,
    locale,
    setAppliedFilters,
    setIsConstraintsLoading,
    structureDataMaps,
  ]);
};
