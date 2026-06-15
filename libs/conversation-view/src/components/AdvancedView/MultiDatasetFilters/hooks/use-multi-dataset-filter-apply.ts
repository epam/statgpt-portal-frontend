'use client';

import {
  DataConstraints,
  DatasetDimensionsMetadataMap,
} from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import isEqual from 'lodash/isEqual';
import { startTransition, useCallback, useMemo } from 'react';
import { Filter, FiltersProps } from '../../../../models/filters';
import { StructureDataMaps } from '../../../../models/structure-data';
import {
  buildFiltersMap,
  getCompatibleDatasetUrns,
  getFiltersByConstraints,
  getQueryFiltersMap,
} from '../../../../utils/multiple-filters';

type ConstraintsMap = Map<string, DataConstraints[] | undefined>;
type ConstraintsMapRef = { current: ConstraintsMap | undefined };

interface UseMultiDatasetFilterApplyParams {
  appliedDisabledUrns: Set<string>;
  appliedFilters: Filter[];
  constraintsMapRef: ConstraintsMapRef;
  dataQueries?: FiltersProps['dataQueries'];
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap;
  disabledDatasetUrns: Set<string>;
  locale?: string;
  modalFilters: Filter[];
  onMultipleDataFiltersChange?: FiltersProps['onMultipleDataFiltersChange'];
  setAppliedFilters: (filters: Filter[]) => void;
  structureDataMaps?: StructureDataMaps;
  closeModal: () => void;
  addSystemMessage: (
    filtersMap: Map<string, Filter[]>,
    disabledDatasetUrns: Set<string>,
  ) => Promise<void>;
}

export const useMultiDatasetFilterApply = ({
  appliedDisabledUrns,
  appliedFilters,
  constraintsMapRef,
  dataQueries,
  datasetDimensionsMetadataMap,
  disabledDatasetUrns,
  locale,
  modalFilters,
  onMultipleDataFiltersChange,
  setAppliedFilters,
  structureDataMaps,
  closeModal,
  addSystemMessage,
}: UseMultiDatasetFilterApplyParams) => {
  const getFiltersChangeParamsMap = useCallback(
    (filtersMap: Map<string, Filter[]>) =>
      getQueryFiltersMap(
        filtersMap,
        dataQueries,
        structureDataMaps?.dimensionsMap,
      ),
    [dataQueries, structureDataMaps?.dimensionsMap],
  );

  const isFiltersUnchanged = useMemo(() => {
    const appliedMap = buildFiltersMap(
      appliedFilters,
      constraintsMapRef.current,
      false,
      datasetDimensionsMetadataMap,
    );
    const modalMap = buildFiltersMap(
      modalFilters,
      constraintsMapRef.current,
      false,
      datasetDimensionsMetadataMap,
    );
    const filtersEqual = isEqual(
      getFiltersChangeParamsMap(appliedMap),
      getFiltersChangeParamsMap(modalMap),
    );
    const disabledEqual = isEqual(
      [...appliedDisabledUrns].sort(),
      [...disabledDatasetUrns].sort(),
    );
    return filtersEqual && disabledEqual;
  }, [
    appliedDisabledUrns,
    appliedFilters,
    constraintsMapRef,
    datasetDimensionsMetadataMap,
    disabledDatasetUrns,
    getFiltersChangeParamsMap,
    modalFilters,
  ]);

  const onApply = useCallback(() => {
    const updatedDataQueries = dataQueries?.map((q) => ({
      ...q,
      disabled: disabledDatasetUrns.has(q.urn),
    }));
    const appliedFiltersMap = buildFiltersMap(
      modalFilters,
      constraintsMapRef.current,
      false,
      datasetDimensionsMetadataMap,
      disabledDatasetUrns,
    );
    const nextAppliedFilters = getFiltersByConstraints(
      appliedFiltersMap,
      {
        ...structureDataMaps,
        constraintsMap: constraintsMapRef.current,
      },
      locale as Locale,
      datasetDimensionsMetadataMap,
    );
    const filtersParamsMap = getFiltersChangeParamsMap(appliedFiltersMap);
    const compatibleUrns = getCompatibleDatasetUrns(
      nextAppliedFilters,
      dataQueries?.map((q) => q.urn) ?? [],
      dataQueries,
      datasetDimensionsMetadataMap,
      appliedFiltersMap,
    );

    const incompatibleUrns = (dataQueries?.map((q) => q.urn) ?? []).filter(
      (urn) => !compatibleUrns.has(urn),
    );
    for (const urn of incompatibleUrns) {
      const filters = appliedFiltersMap.get(urn);
      if (filters) {
        appliedFiltersMap.set(
          urn,
          filters.map((filter) =>
            !filter.isTimeDimension &&
            filter.dimensionValues?.length &&
            !filter.dimensionValues.some((v) => v.isSelectedValue)
              ? { ...filter, isExcluded: true }
              : filter,
          ),
        );
      }
    }

    onMultipleDataFiltersChange?.(
      filtersParamsMap,
      constraintsMapRef.current,
      updatedDataQueries?.filter(
        (q) => compatibleUrns.has(q.urn) || q.disabled,
      ),
      appliedFiltersMap,
      nextAppliedFilters,
    );

    setAppliedFilters(nextAppliedFilters);
    closeModal();

    startTransition(() => {
      addSystemMessage(appliedFiltersMap, disabledDatasetUrns);
    });
  }, [
    addSystemMessage,
    closeModal,
    constraintsMapRef,
    dataQueries,
    datasetDimensionsMetadataMap,
    disabledDatasetUrns,
    getFiltersChangeParamsMap,
    locale,
    modalFilters,
    onMultipleDataFiltersChange,
    setAppliedFilters,
    structureDataMaps,
  ]);

  return {
    getFiltersChangeParamsMap,
    isFiltersUnchanged,
    onApply,
  };
};
