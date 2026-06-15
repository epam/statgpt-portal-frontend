'use client';

import {
  DataConstraints,
  DatasetDimensionsMetadataMap,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery, Locale } from '@epam/statgpt-shared-toolkit';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Filter, FiltersProps } from '../../../../models/filters';
import { StructureDataMaps } from '../../../../models/structure-data';
import {
  isSameFilter,
  updateFiltersWithDisabledOption,
  updateFiltersWithSelectedItem,
} from '../../../../utils/filters';
import { cleanIncompatibleFiltersMap } from '../../../../utils/incompatible-filters';
import {
  buildFiltersMap,
  getConstraintsMapFromSettledResults,
  getConstraintsRequests,
  getFiltersByConstraints,
  hasUncachedConstraintRequests,
  mergeConstraintsMaps,
} from '../../../../utils/multiple-filters';
import { useFilterValuesLoading } from '../../Filters/hooks/use-filter-values-loading';

type ConstraintsMap = Map<string, DataConstraints[] | undefined>;
type ConstraintsMapRef = { current: ConstraintsMap | undefined };
type SetFilters = (filters: Filter[]) => void;
type SetBooleanLoading = (isLoading: boolean) => void;

interface UseMultiDatasetFilterConstraintsParams {
  actions?: FiltersProps['actions'];
  dataQueries?: FiltersProps['dataQueries'];
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap;
  structureDataMaps?: StructureDataMaps;
  constraintsMapRef: ConstraintsMapRef;
  locale?: string;
  modalFilters: Filter[];
  setModalFilters: SetFilters;
  setSelectedFilter: Dispatch<SetStateAction<Filter | undefined>>;
  rebuildHierarchyTree: (
    filter: Filter,
    constraints?: DataConstraints[],
  ) => void;
  getConstraintsForFilter: (filter: Filter) => DataConstraints[] | undefined;
}

export const useMultiDatasetFilterConstraints = ({
  actions,
  dataQueries,
  datasetDimensionsMetadataMap,
  structureDataMaps,
  constraintsMapRef,
  locale,
  modalFilters,
  setModalFilters,
  setSelectedFilter,
  rebuildHierarchyTree,
  getConstraintsForFilter,
}: UseMultiDatasetFilterConstraintsParams) => {
  const [initialModalConstraintsMap, setInitialModalConstraintsMap] =
    useState<ConstraintsMap>();
  const [isConstraintsLoading, setIsConstraintsLoading] = useState<boolean>();
  const [isDisableFilterValues, setIsDisableFilterValues] = useState<boolean>();
  const {
    isLoading: isFilterValuesLoading,
    startLoading,
    finishLoading,
  } = useFilterValuesLoading();

  const rememberInitialModalConstraintsMap = useCallback(() => {
    setInitialModalConstraintsMap(constraintsMapRef.current);
  }, [constraintsMapRef]);

  const restoreInitialModalConstraintsMap = useCallback(() => {
    constraintsMapRef.current = initialModalConstraintsMap;
  }, [constraintsMapRef, initialModalConstraintsMap]);

  const getFiltersByCurrentConstraints = useCallback(
    (
      filtersMap: Map<string, Filter[]>,
      nextStructureDataMaps?: StructureDataMaps,
    ) =>
      getFiltersByConstraints(
        filtersMap,
        nextStructureDataMaps,
        locale as Locale,
        datasetDimensionsMetadataMap,
      ),
    [datasetDimensionsMetadataMap, locale],
  );

  const updateSelectedFilterFromFilledFilters = useCallback(
    (filledFilters: Filter[], changedFilter: Filter) => {
      const updatedSelectedFilter = filledFilters.find((filter) =>
        isSameFilter(filter, changedFilter),
      );

      setSelectedFilter((currentFilter) =>
        currentFilter &&
        updatedSelectedFilter &&
        isSameFilter(currentFilter, changedFilter)
          ? { ...updatedSelectedFilter, isSelectedFilter: true }
          : currentFilter,
      );
    },
    [setSelectedFilter],
  );

  const handleFiltersWithConstraints = useCallback(
    (
      filters: Filter[],
      setFilters: SetFilters,
      setLoading?: SetBooleanLoading,
      changedFilter?: Filter,
    ) => {
      const filtersMap = buildFiltersMap(
        filters,
        constraintsMapRef.current,
        false,
        datasetDimensionsMetadataMap,
      );
      const shouldTrackLoading = hasUncachedConstraintRequests(
        dataQueries,
        filtersMap,
        actions,
        datasetDimensionsMetadataMap,
        filters,
      );

      if (shouldTrackLoading) {
        startLoading();
      }

      const requests = getConstraintsRequests(
        dataQueries,
        filtersMap,
        actions,
        datasetDimensionsMetadataMap,
        filters,
      );

      Promise.allSettled(requests)
        .then((constraintsResults) => {
          const currentConstraintsMap = mergeConstraintsMaps(
            constraintsMapRef.current || structureDataMaps?.constraintsMap,
            getConstraintsMapFromSettledResults(constraintsResults),
          );
          const structureDataMapsWithConstraints = {
            ...structureDataMaps,
            constraintsMap: currentConstraintsMap,
          };

          if (changedFilter) {
            const { filtersMap: cleanedMap, changed } =
              cleanIncompatibleFiltersMap(
                filtersMap,
                structureDataMapsWithConstraints,
                changedFilter,
                locale as Locale,
                datasetDimensionsMetadataMap,
              );

            if (changed) {
              constraintsMapRef.current = currentConstraintsMap;
              setLoading?.(true);
              setIsDisableFilterValues(true);
              const cleanedMerged = getFiltersByCurrentConstraints(
                cleanedMap,
                structureDataMapsWithConstraints,
              );
              handleFiltersWithConstraints(
                cleanedMerged,
                setFilters,
                setLoading,
                changedFilter,
              );
              return;
            }
          }

          const filledFilters = getFiltersByCurrentConstraints(
            filtersMap,
            structureDataMapsWithConstraints,
          );

          constraintsMapRef.current = currentConstraintsMap;
          setLoading?.(false);
          setFilters(filledFilters);
          if (changedFilter) {
            updateSelectedFilterFromFilledFilters(filledFilters, changedFilter);
            rebuildHierarchyTree(
              changedFilter,
              getConstraintsForFilter(changedFilter),
            );
          }
        })
        .catch(() => {
          const currentConstraintsMap =
            constraintsMapRef.current ||
            structureDataMaps?.constraintsMap ||
            new Map();
          const filledFilters = getFiltersByCurrentConstraints(filtersMap, {
            ...structureDataMaps,
            constraintsMap: currentConstraintsMap,
          });

          constraintsMapRef.current = currentConstraintsMap;
          setLoading?.(false);
          setFilters(filledFilters);
          if (changedFilter) {
            updateSelectedFilterFromFilledFilters(filledFilters, changedFilter);
          }
        })
        .finally(() => {
          setIsDisableFilterValues(false);
          if (shouldTrackLoading) {
            finishLoading();
          }
        });
    },
    [
      actions,
      constraintsMapRef,
      dataQueries,
      datasetDimensionsMetadataMap,
      finishLoading,
      getConstraintsForFilter,
      getFiltersByCurrentConstraints,
      locale,
      rebuildHierarchyTree,
      startLoading,
      structureDataMaps,
      updateSelectedFilterFromFilledFilters,
    ],
  );

  const updateViewAfterDelete = useCallback(
    (
      filtersToUpdateMap: Map<string, Filter[]>,
      nextStructureDataMaps?: StructureDataMaps,
    ) => {
      const filledFilters = getFiltersByCurrentConstraints(
        filtersToUpdateMap,
        nextStructureDataMaps,
      );
      constraintsMapRef.current = nextStructureDataMaps?.constraintsMap;

      setSelectedFilter(
        (previousSelectedFilter) =>
          filledFilters?.find((filter) =>
            isSameFilter(filter, previousSelectedFilter),
          ) || previousSelectedFilter,
      );
      setModalFilters(filledFilters);
      setIsDisableFilterValues(false);
    },
    [
      constraintsMapRef,
      getFiltersByCurrentConstraints,
      setModalFilters,
      setSelectedFilter,
    ],
  );

  const handleFiltersDelete = useCallback(
    (filtersToUpdate: Filter[], targetDataQueries?: DataQuery[]) => {
      setIsDisableFilterValues(true);
      setModalFilters(updateFiltersWithDisabledOption(filtersToUpdate));
      const filtersMap = buildFiltersMap(
        filtersToUpdate,
        constraintsMapRef.current,
        false,
        datasetDimensionsMetadataMap,
      );
      const currentConstraintsMap =
        constraintsMapRef.current ||
        structureDataMaps?.constraintsMap ||
        new Map<string, DataConstraints[] | undefined>();
      const shouldTrackLoading = hasUncachedConstraintRequests(
        targetDataQueries,
        filtersMap,
        actions,
        datasetDimensionsMetadataMap,
        filtersToUpdate,
      );

      if (shouldTrackLoading) {
        startLoading();
      }

      const requests = getConstraintsRequests(
        targetDataQueries,
        filtersMap,
        actions,
        datasetDimensionsMetadataMap,
        filtersToUpdate,
      );

      Promise.allSettled(requests)
        .then((constraintsResults) => {
          const mergedConstraintsMap = mergeConstraintsMaps(
            currentConstraintsMap,
            getConstraintsMapFromSettledResults(constraintsResults),
          );
          updateViewAfterDelete(filtersMap, {
            ...structureDataMaps,
            constraintsMap: mergedConstraintsMap,
          });
        })
        .catch(() => {
          updateViewAfterDelete(filtersMap, {
            ...structureDataMaps,
            constraintsMap: currentConstraintsMap,
          });
        })
        .finally(() => {
          if (shouldTrackLoading) {
            finishLoading();
          }
        });
    },
    [
      actions,
      constraintsMapRef,
      datasetDimensionsMetadataMap,
      finishLoading,
      setModalFilters,
      startLoading,
      structureDataMaps,
      updateViewAfterDelete,
    ],
  );

  const updateSelectedFilterValues = useCallback(
    (filter?: Filter) => {
      const filters = filter
        ? modalFilters.map((oldFilter) =>
            isSameFilter(oldFilter, filter) ? filter : oldFilter,
          )
        : modalFilters;

      setIsDisableFilterValues(true);
      setModalFilters(updateFiltersWithDisabledOption(filters));
      setIsConstraintsLoading(true);
      handleFiltersWithConstraints(
        filter?.isTimeDimension
          ? updateFiltersWithSelectedItem(filters, filter)
          : filters,
        setModalFilters,
        setIsConstraintsLoading,
        filter,
      );
    },
    [handleFiltersWithConstraints, modalFilters, setModalFilters],
  );

  return {
    isConstraintsLoading,
    isDisableFilterValues,
    isFilterValuesLoading,
    setIsConstraintsLoading,
    handleFiltersWithConstraints,
    handleFiltersDelete,
    updateSelectedFilterValues,
    rememberInitialModalConstraintsMap,
    restoreInitialModalConstraintsMap,
  };
};
