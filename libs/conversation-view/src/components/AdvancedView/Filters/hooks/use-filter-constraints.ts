'use client';

import { DataConstraints } from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Filter } from '../../../../models/filters';
import {
  isSameFilter,
  updateFiltersWithDisabledOption,
  updateFiltersWithSelectedItem,
} from '../../../../utils/filters';
import { useFilterValuesLoading } from './use-filter-values-loading';

type SetFilters = (filters: Filter[]) => void;
type SetBooleanLoading = (isLoading: boolean) => void;

/**
 * Mode-specific constraint operations injected into the shared
 * {@link useFilterConstraints} skeleton. The single-dataset flow works on a
 * flat `DataConstraints[]`; the multi-dataset flow works on a per-dataset map.
 * `TResult` is the opaque per-call constraints payload each mode produces.
 */
export interface FilterConstraintsStrategy<TResult> {
  /**
   * Fire the constraint request(s) for `filters`. `shouldTrackLoading` drives
   * the shared loading counter. `targetDataQueries` narrows the request set on
   * the delete path (multi-dataset only; ignored by single-dataset).
   */
  startFetch: (
    filters: Filter[],
    targetDataQueries?: DataQuery[],
  ) => { promise: Promise<TResult>; shouldTrackLoading: boolean };
  /** Constraints payload to use when a request fails. */
  fallbackResult: (filters: Filter[]) => TResult;
  /** Drop values no longer supported by the fetched constraints. */
  cleanIncompatible: (
    filters: Filter[],
    result: TResult,
    changedFilter: Filter,
  ) => { filters: Filter[]; changed: boolean };
  /** Fill `filters` with the fetched constraints. */
  fill: (filters: Filter[], result: TResult) => Filter[];
  /** Persist the fetched constraints into the mode-specific ref. */
  commit: (result: TResult) => void;
  /** Constraints to rebuild the hierarchy tree with after a change. */
  getRebuildConstraints: (
    changedFilter: Filter,
    result: TResult,
  ) => DataConstraints[] | undefined;
}

interface UseFilterConstraintsParams<TResult> {
  strategy: FilterConstraintsStrategy<TResult>;
  modalFilters: Filter[];
  setModalFilters: SetFilters;
  setSelectedFilter: Dispatch<SetStateAction<Filter | undefined>>;
  rebuildHierarchyTree: (
    filter: Filter,
    constraints?: DataConstraints[],
  ) => void;
}

/**
 * Shared constraint-fetching control flow for both filter modes. The async
 * skeleton (request → optionally clean-and-recurse → fill/commit → catch/finally)
 * is identical across single- and multi-dataset; the mode-specific primitives
 * arrive through `strategy`.
 */
export const useFilterConstraints = <TResult>({
  strategy,
  modalFilters,
  setModalFilters,
  setSelectedFilter,
  rebuildHierarchyTree,
}: UseFilterConstraintsParams<TResult>) => {
  const [isConstraintsLoading, setIsConstraintsLoading] = useState<boolean>();
  const [isDisableFilterValues, setIsDisableFilterValues] = useState<boolean>();
  const {
    isLoading: isFilterValuesLoading,
    startLoading,
    finishLoading,
  } = useFilterValuesLoading();

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
      const { promise, shouldTrackLoading } = strategy.startFetch(filters);

      if (shouldTrackLoading) {
        startLoading();
      }

      promise
        .then((result) => {
          if (changedFilter) {
            const { filters: cleanedFilters, changed } =
              strategy.cleanIncompatible(filters, result, changedFilter);

            if (changed) {
              strategy.commit(result);
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

          const filledFilters = strategy.fill(filters, result);

          strategy.commit(result);
          setLoading?.(false);
          setFilters(filledFilters);
          if (changedFilter) {
            updateSelectedFilterFromFilledFilters(filledFilters, changedFilter);
            rebuildHierarchyTree(
              changedFilter,
              strategy.getRebuildConstraints(changedFilter, result),
            );
          }
        })
        .catch(() => {
          const result = strategy.fallbackResult(filters);
          const filledFilters = strategy.fill(filters, result);

          strategy.commit(result);
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
      finishLoading,
      rebuildHierarchyTree,
      startLoading,
      strategy,
      updateSelectedFilterFromFilledFilters,
    ],
  );

  const updateViewAfterDelete = useCallback(
    (filtersToUpdate: Filter[], result: TResult) => {
      const filledFilters = strategy.fill(filtersToUpdate, result);
      strategy.commit(result);

      setSelectedFilter(
        (previousSelectedFilter) =>
          filledFilters?.find((filter) =>
            isSameFilter(filter, previousSelectedFilter),
          ) || previousSelectedFilter,
      );
      setModalFilters(filledFilters);
      setIsDisableFilterValues(false);
    },
    [setModalFilters, setSelectedFilter, strategy],
  );

  const handleFiltersDelete = useCallback(
    (filtersToUpdate: Filter[], targetDataQueries?: DataQuery[]) => {
      setIsDisableFilterValues(true);
      setModalFilters(updateFiltersWithDisabledOption(filtersToUpdate));

      const { promise, shouldTrackLoading } = strategy.startFetch(
        filtersToUpdate,
        targetDataQueries,
      );

      if (shouldTrackLoading) {
        startLoading();
      }

      promise
        .then((result) => {
          updateViewAfterDelete(filtersToUpdate, result);
        })
        .catch(() => {
          updateViewAfterDelete(
            filtersToUpdate,
            strategy.fallbackResult(filtersToUpdate),
          );
        })
        .finally(() => {
          if (shouldTrackLoading) {
            finishLoading();
          }
        });
    },
    [
      finishLoading,
      setModalFilters,
      startLoading,
      strategy,
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
  };
};
