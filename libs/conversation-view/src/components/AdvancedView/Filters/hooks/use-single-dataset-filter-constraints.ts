'use client';

import { DataConstraints } from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Filter, FiltersProps } from '../../../../models/filters';
import {
  isSameFilter,
  updateFiltersWithDisabledOption,
  updateFiltersWithSelectedItem,
} from '../../../../utils/filters';
import { getFilledFilters } from '../../../../utils/get-filled-filters';
import { cleanIncompatibleFilters } from '../../../../utils/incompatible-filters';
import { getSingleDatasetConstraintsRequest } from '../../../../utils/single-dataset-filters';
import { useFilterValuesLoading } from './use-filter-values-loading';

type SetFilters = (filters: Filter[]) => void;
type SetBooleanLoading = (isLoading: boolean) => void;
type ConstraintsRef = { current: DataConstraints[] };

interface UseSingleDatasetFilterConstraintsParams {
  actions?: FiltersProps['actions'];
  attachmentUrn?: string;
  dimensions?: FiltersProps['dimensions'];
  structures?: FiltersProps['structures'];
  constraintsRef: ConstraintsRef;
  locale?: string;
  modalFilters: Filter[];
  setModalFilters: SetFilters;
  setSelectedFilter: Dispatch<SetStateAction<Filter | undefined>>;
  rebuildHierarchyTree: (
    filter: Filter,
    constraints?: DataConstraints[],
  ) => void;
}

export const useSingleDatasetFilterConstraints = ({
  actions,
  attachmentUrn,
  dimensions,
  structures,
  constraintsRef,
  locale,
  modalFilters,
  setModalFilters,
  setSelectedFilter,
  rebuildHierarchyTree,
}: UseSingleDatasetFilterConstraintsParams) => {
  const [initialModalConstraints, setInitialModalConstraints] = useState<
    DataConstraints[]
  >([]);
  const [isConstraintsLoading, setIsConstraintsLoading] = useState<boolean>();
  const [isDisableFilterValues, setIsDisableFilterValues] = useState<boolean>();
  const {
    isLoading: isFilterValuesLoading,
    startLoading,
    finishLoading,
  } = useFilterValuesLoading();

  const rememberInitialModalConstraints = useCallback(() => {
    setInitialModalConstraints(constraintsRef.current);
  }, [constraintsRef]);

  const restoreInitialModalConstraints = useCallback(() => {
    constraintsRef.current = initialModalConstraints;
  }, [constraintsRef, initialModalConstraints]);

  const getFilledFiltersByConstraints = useCallback(
    (filters: Filter[], constraints: DataConstraints[]) =>
      getFilledFilters(
        filters,
        dimensions,
        structures,
        constraints,
        locale as Locale,
      ),
    [dimensions, locale, structures],
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
      const { request, shouldTrackLoading } =
        getSingleDatasetConstraintsRequest(
          actions,
          attachmentUrn ?? '',
          filters,
        );

      if (shouldTrackLoading) {
        startLoading();
      }

      request
        .then((constraints) => {
          const newConstraints = constraints?.data?.dataConstraints || [];

          if (changedFilter) {
            const { filters: cleanedFilters, changed } =
              cleanIncompatibleFilters(
                filters,
                dimensions,
                structures,
                newConstraints,
                changedFilter,
                locale as Locale,
              );

            if (changed) {
              constraintsRef.current = newConstraints;
              setLoading?.(true);
              setIsDisableFilterValues(true);
              handleFiltersWithConstraints(
                cleanedFilters,
                setFilters,
                setLoading,
                changedFilter,
              );
              return;
            }
          }

          const filledFilters = getFilledFiltersByConstraints(
            filters,
            newConstraints,
          );

          constraintsRef.current = newConstraints;
          setLoading?.(false);
          setFilters(filledFilters);
          if (changedFilter) {
            updateSelectedFilterFromFilledFilters(filledFilters, changedFilter);
            rebuildHierarchyTree(changedFilter, newConstraints);
          }
        })
        .catch(() => {
          const filledFilters = getFilledFiltersByConstraints(filters, []);

          constraintsRef.current = [];
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
      attachmentUrn,
      constraintsRef,
      dimensions,
      finishLoading,
      getFilledFiltersByConstraints,
      locale,
      rebuildHierarchyTree,
      startLoading,
      structures,
      updateSelectedFilterFromFilledFilters,
    ],
  );

  const updateViewAfterDelete = useCallback(
    (dataConstraints: DataConstraints[], filtersToUpdate: Filter[]) => {
      const filledFilters = getFilledFiltersByConstraints(
        filtersToUpdate,
        dataConstraints,
      );
      constraintsRef.current = dataConstraints;

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
      constraintsRef,
      getFilledFiltersByConstraints,
      setModalFilters,
      setSelectedFilter,
    ],
  );

  const handleFiltersDelete = useCallback(
    (filtersToUpdate: Filter[]) => {
      setIsDisableFilterValues(true);
      setModalFilters(updateFiltersWithDisabledOption(filtersToUpdate));

      const { request, shouldTrackLoading } =
        getSingleDatasetConstraintsRequest(
          actions,
          attachmentUrn ?? '',
          filtersToUpdate,
        );

      if (shouldTrackLoading) {
        startLoading();
      }

      request
        .then((constraints) => {
          updateViewAfterDelete(
            constraints?.data?.dataConstraints || [],
            filtersToUpdate,
          );
        })
        .catch(() => {
          updateViewAfterDelete([], filtersToUpdate);
        })
        .finally(() => {
          if (shouldTrackLoading) {
            finishLoading();
          }
        });
    },
    [
      actions,
      attachmentUrn,
      finishLoading,
      setModalFilters,
      startLoading,
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
    rememberInitialModalConstraints,
    restoreInitialModalConstraints,
  };
};
