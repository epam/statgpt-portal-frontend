'use client';

import {
  DataConstraints,
  getTimeSeriesCount,
} from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import isEqual from 'lodash/isEqual';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Filter, FiltersProps } from '../../../../models/filters';
import { getFilledFilters } from '../../../../utils/get-filled-filters';
import { getSourceArtefactUrnForDatasetFilter } from '../../../../utils/hierarchy-request-context';
import { cleanIncompatibleFilters } from '../../../../utils/incompatible-filters';
import { getQueryFilters } from '../../../../utils/query-filters';
import {
  getCodelistUrnForDatasetFilter,
  getSingleDatasetConstraintsRequest,
  getSingleDatasetFiltersPreselectedByDataQuery,
} from '../../../../utils/single-dataset-filters';
import { FilterApplyStrategy } from './use-filter-apply';
import { FilterConstraintsStrategy } from './use-filter-constraints';
import {
  FilterInitResult,
  FilterInitStrategy,
} from './use-filter-initialization';
import { FilterStrategy } from './use-filters';

interface UseSingleFilterStrategyParams {
  actions?: FiltersProps['actions'];
  attachmentsDataQuery?: FiltersProps['attachmentsDataQuery'];
  dimensions?: FiltersProps['dimensions'];
  structureDimensions?: FiltersProps['structureDimensions'];
  structures?: FiltersProps['structures'];
  initialConstraints?: DataConstraints[];
  locale?: string;
  onFiltersChange?: FiltersProps['onFiltersChange'];
}

/**
 * Single-dataset filter strategy. Owns the flat `DataConstraints[]` ref and
 * provides the array-shaped constraint, apply and init primitives the shared
 * {@link useFilters} orchestration injects, plus the hierarchy getters and
 * the modal remember/restore snapshot.
 */
export const useSingleFilterStrategy = ({
  actions,
  attachmentsDataQuery,
  dimensions,
  structureDimensions,
  structures,
  initialConstraints,
  locale,
  onFiltersChange,
}: UseSingleFilterStrategyParams): FilterStrategy<DataConstraints[]> => {
  const constraintsRef = useRef<DataConstraints[]>(initialConstraints || []);
  const isPreselectedFromDataQuery = useRef(false);
  const [initialModalConstraints, setInitialModalConstraints] = useState<
    DataConstraints[]
  >([]);

  const startFetch = useCallback(
    (filters: Filter[]) => {
      const { request, shouldTrackLoading } =
        getSingleDatasetConstraintsRequest(
          actions,
          attachmentsDataQuery?.urn ?? '',
          filters,
        );
      return {
        promise: request.then(
          (constraints) => constraints?.data?.dataConstraints || [],
        ),
        shouldTrackLoading,
      };
    },
    [actions, attachmentsDataQuery],
  );

  const fallbackResult = useCallback((): DataConstraints[] => [], []);

  const cleanIncompatible = useCallback(
    (filters: Filter[], result: DataConstraints[], changedFilter: Filter) =>
      cleanIncompatibleFilters(
        filters,
        dimensions,
        structures,
        result,
        changedFilter,
        locale as Locale,
      ),
    [dimensions, structures, locale],
  );

  const fill = useCallback(
    (filters: Filter[], result: DataConstraints[]) =>
      getFilledFilters(
        filters,
        dimensions,
        structures,
        result,
        locale as Locale,
      ),
    [dimensions, structures, locale],
  );

  const commit = useCallback((result: DataConstraints[]) => {
    constraintsRef.current = result;
  }, []);

  const getRebuildConstraints = useCallback(
    (_changedFilter: Filter, result: DataConstraints[]) => result,
    [],
  );

  const getConstraintsForFilter = useCallback(() => constraintsRef.current, []);

  const getCodelistUrnForFilter = useCallback(
    (filter: Filter): string | undefined =>
      getCodelistUrnForDatasetFilter(filter, dimensions, structures),
    [dimensions, structures],
  );

  const getSourceArtefactUrn = useCallback(
    (filter: Filter) =>
      getSourceArtefactUrnForDatasetFilter(filter.id, structures),
    [structures],
  );

  const getIsFiltersUnchanged = useCallback(
    (modalFilters: Filter[], appliedFilters: Filter[]) =>
      isEqual(
        getQueryFilters(modalFilters, dimensions),
        getQueryFilters(appliedFilters, dimensions),
      ),
    [dimensions],
  );

  const runApply = useCallback(
    (modalFilters: Filter[]) => {
      const params = getQueryFilters(modalFilters, dimensions);
      onFiltersChange?.(params, constraintsRef.current, modalFilters);
      return {
        appliedFilters: modalFilters,
        systemMessageFilters: modalFilters,
      };
    },
    [dimensions, onFiltersChange],
  );

  const prepareInit = useCallback((): FilterInitResult => {
    if (isPreselectedFromDataQuery.current || !structures) {
      return { status: 'skip' };
    }
    const filters = getSingleDatasetFiltersPreselectedByDataQuery({
      dimensions,
      structures,
      structureDimensions,
      locale,
      constraints: constraintsRef.current,
      dataQuery: attachmentsDataQuery,
    });
    return { status: 'ready', filters };
  }, [
    attachmentsDataQuery,
    dimensions,
    locale,
    structureDimensions,
    structures,
  ]);

  const markInitialized = useCallback(() => {
    isPreselectedFromDataQuery.current = true;
  }, []);

  const remember = useCallback(() => {
    setInitialModalConstraints(constraintsRef.current);
  }, []);

  const restore = useCallback(() => {
    constraintsRef.current = initialModalConstraints;
  }, [initialModalConstraints]);

  // Single-dataset has one dataset, so there is nothing to narrow the
  // constraint refresh to — the constraints request always covers it.
  const getDeleteTargets = useCallback(() => undefined, []);
  const getClearTargets = useCallback(() => undefined, []);

  const constraints = useMemo<FilterConstraintsStrategy<DataConstraints[]>>(
    () => ({
      startFetch,
      fallbackResult,
      cleanIncompatible,
      fill,
      commit,
      getRebuildConstraints,
    }),
    [
      startFetch,
      fallbackResult,
      cleanIncompatible,
      fill,
      commit,
      getRebuildConstraints,
    ],
  );

  const apply = useMemo<FilterApplyStrategy>(
    () => ({ getIsFiltersUnchanged, runApply }),
    [getIsFiltersUnchanged, runApply],
  );

  const init = useMemo<FilterInitStrategy>(
    () => ({ prepareInit, markInitialized }),
    [prepareInit, markInitialized],
  );

  const controllerOptions = useMemo(
    () => ({
      initialConstraints,
      dataQueries: attachmentsDataQuery ? [attachmentsDataQuery] : undefined,
    }),
    [initialConstraints, attachmentsDataQuery],
  );

  const timeSeriesCount = Number(
    getTimeSeriesCount(constraintsRef.current?.[0]?.annotations),
  );

  return {
    mode: 'single',
    constraints,
    apply,
    init,
    getConstraintsForFilter,
    getCodelistUrnForFilter,
    getSourceArtefactUrn,
    remember,
    restore,
    getDeleteTargets,
    getClearTargets,
    controllerOptions,
    timeSeriesCount,
  };
};
