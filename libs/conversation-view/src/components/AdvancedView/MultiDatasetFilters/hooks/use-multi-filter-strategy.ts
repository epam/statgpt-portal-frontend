'use client';

import {
  DataConstraints,
  DatasetDimensionsMetadataMap,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  Locale,
  QueryFilterType,
} from '@epam/statgpt-shared-toolkit';
import isEqual from 'lodash/isEqual';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Filter, FiltersProps } from '../../../../models/filters';
import { StructureDataMaps } from '../../../../models/structure-data';
import { FilterApplyStrategy } from '../../Filters/hooks/use-filter-apply';
import { FilterConstraintsStrategy } from '../../Filters/hooks/use-filter-constraints';
import {
  FilterInitResult,
  FilterInitStrategy,
} from '../../Filters/hooks/use-filter-initialization';
import { FilterStrategy } from '../../Filters/hooks/use-filters';
import { getHierarchyRequestContextForFilter } from '../../../../utils/hierarchy-request-context';
import { cleanIncompatibleFiltersMap } from '../../../../utils/incompatible-filters';
import {
  buildFiltersMap,
  getCompatibleDatasetUrns,
  getConstraintsMapFromSettledResults,
  getConstraintsRequests,
  getFilledDatasetFiltersMap,
  getFiltersByConstraints,
  getFiltersPreselectedByDataQueries,
  getQueryFiltersMap,
  hasUncachedConstraintRequests,
  isStructureDataMapsReady,
  mergeConstraintsMaps,
} from '../../../../utils/multiple-filters';
import { useMultiDatasetDisplayDataQueries } from './use-multi-dataset-display-data-queries';

type ConstraintsMap = Map<string, DataConstraints[] | undefined>;

export interface MultiConstraintsResult {
  filtersMap: Map<string, Filter[]>;
  constraints: ConstraintsMap;
  structureDataMaps: StructureDataMaps;
}

interface UseMultiFilterStrategyParams {
  actions?: FiltersProps['actions'];
  dataQueries?: FiltersProps['dataQueries'];
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap;
  structureDataMaps?: StructureDataMaps;
  datasetIcon?: FiltersProps['datasetIcon'];
  locale?: string;
  onMultipleDataFiltersChange?: FiltersProps['onMultipleDataFiltersChange'];
}

/**
 * Multi-dataset (cross-dataset) filter strategy. Owns the per-dataset
 * constraints map ref and provides the map-shaped constraint, apply and init
 * primitives the shared {@link useFilters} orchestration injects, plus the
 * hierarchy getters and the modal remember/restore snapshot.
 */
export const useMultiFilterStrategy = ({
  actions,
  dataQueries,
  datasetDimensionsMetadataMap,
  structureDataMaps,
  datasetIcon,
  locale,
  onMultipleDataFiltersChange,
}: UseMultiFilterStrategyParams): FilterStrategy<MultiConstraintsResult> => {
  const constraintsMapRef = useRef<ConstraintsMap | undefined>(
    structureDataMaps?.constraintsMap,
  );
  const [initialModalConstraintsMap, setInitialModalConstraintsMap] =
    useState<ConstraintsMap>();

  const isStructureDataReady = useMemo(
    () => isStructureDataMapsReady(dataQueries, structureDataMaps),
    [dataQueries, structureDataMaps],
  );

  const displayDataQueries = useMultiDatasetDisplayDataQueries(
    dataQueries,
    structureDataMaps?.structuresMap,
    locale,
  );

  const getConstraintsForFilter = useCallback((filter: Filter) => {
    const datasetUrn =
      filter.filterType === 'dataset'
        ? filter.datasetUrn
        : filter.sourceDatasetUrns?.[0];
    return datasetUrn ? constraintsMapRef.current?.get(datasetUrn) : undefined;
  }, []);

  const getHierarchyRequestContext = useCallback(
    (filter: Filter) =>
      getHierarchyRequestContextForFilter(
        filter,
        structureDataMaps?.dimensionsMap,
        structureDataMaps?.structuresMap,
      ),
    [structureDataMaps?.dimensionsMap, structureDataMaps?.structuresMap],
  );

  const getCodelistUrnForFilter = useCallback(
    (filter: Filter) => getHierarchyRequestContext(filter).codelistUrn,
    [getHierarchyRequestContext],
  );

  const getSourceArtefactUrn = useCallback(
    (filter: Filter) => getHierarchyRequestContext(filter).sourceArtefactUrn,
    [getHierarchyRequestContext],
  );

  const startFetch = useCallback(
    (filters: Filter[], targetDataQueries?: DataQuery[]) => {
      const filtersMap = buildFiltersMap(
        filters,
        constraintsMapRef.current,
        false,
        datasetDimensionsMetadataMap,
      );
      const queriesForRequests = targetDataQueries ?? dataQueries;
      const shouldTrackLoading = hasUncachedConstraintRequests(
        queriesForRequests,
        filtersMap,
        actions,
        datasetDimensionsMetadataMap,
        filters,
      );
      const requests = getConstraintsRequests(
        queriesForRequests,
        filtersMap,
        actions,
        datasetDimensionsMetadataMap,
        filters,
      );

      const promise = Promise.allSettled(requests).then(
        (constraintsResults): MultiConstraintsResult => {
          const constraints = mergeConstraintsMaps(
            constraintsMapRef.current || structureDataMaps?.constraintsMap,
            getConstraintsMapFromSettledResults(constraintsResults),
          );
          return {
            filtersMap,
            constraints,
            structureDataMaps: {
              ...structureDataMaps,
              constraintsMap: constraints,
            } as StructureDataMaps,
          };
        },
      );

      return { promise, shouldTrackLoading };
    },
    [actions, dataQueries, datasetDimensionsMetadataMap, structureDataMaps],
  );

  const fallbackResult = useCallback(
    (filters: Filter[]): MultiConstraintsResult => {
      const filtersMap = buildFiltersMap(
        filters,
        constraintsMapRef.current,
        false,
        datasetDimensionsMetadataMap,
      );
      const constraints =
        constraintsMapRef.current ||
        structureDataMaps?.constraintsMap ||
        new Map<string, DataConstraints[] | undefined>();
      return {
        filtersMap,
        constraints,
        structureDataMaps: {
          ...structureDataMaps,
          constraintsMap: constraints,
        } as StructureDataMaps,
      };
    },
    [datasetDimensionsMetadataMap, structureDataMaps],
  );

  const cleanIncompatible = useCallback(
    (
      filters: Filter[],
      result: MultiConstraintsResult,
      changedFilter: Filter,
    ) => {
      const { filtersMap: cleanedMap, changed } = cleanIncompatibleFiltersMap(
        result.filtersMap,
        result.structureDataMaps,
        changedFilter,
        locale as Locale,
        datasetDimensionsMetadataMap,
      );

      if (!changed) {
        return { filters, changed: false };
      }

      const cleanedMerged = getFiltersByConstraints(
        cleanedMap,
        result.structureDataMaps,
        locale as Locale,
        datasetDimensionsMetadataMap,
      );
      return { filters: cleanedMerged, changed: true };
    },
    [datasetDimensionsMetadataMap, locale],
  );

  const fill = useCallback(
    (_filters: Filter[], result: MultiConstraintsResult) =>
      getFiltersByConstraints(
        result.filtersMap,
        result.structureDataMaps,
        locale as Locale,
        datasetDimensionsMetadataMap,
      ),
    [datasetDimensionsMetadataMap, locale],
  );

  const commit = useCallback((result: MultiConstraintsResult) => {
    constraintsMapRef.current = result.constraints;
  }, []);

  const getRebuildConstraints = useCallback(
    (changedFilter: Filter) => getConstraintsForFilter(changedFilter),
    [getConstraintsForFilter],
  );

  const getFiltersChangeParamsMap = useCallback(
    (filtersMap: Map<string, Filter[]>) =>
      getQueryFiltersMap(
        filtersMap,
        dataQueries,
        structureDataMaps?.dimensionsMap,
      ),
    [dataQueries, structureDataMaps?.dimensionsMap],
  );

  const getIsFiltersUnchanged = useCallback(
    (
      modalFilters: Filter[],
      appliedFilters: Filter[],
      disabledDatasetUrns: Set<string>,
      appliedDisabledUrns: Set<string>,
    ) => {
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
    },
    [datasetDimensionsMetadataMap, getFiltersChangeParamsMap],
  );

  const runApply = useCallback(
    (modalFilters: Filter[], disabledDatasetUrns: Set<string>) => {
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
        } as StructureDataMaps,
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

      return {
        appliedFilters: nextAppliedFilters,
        systemMessageFilters: appliedFiltersMap,
      };
    },
    [
      dataQueries,
      datasetDimensionsMetadataMap,
      getFiltersChangeParamsMap,
      locale,
      onMultipleDataFiltersChange,
      structureDataMaps,
    ],
  );

  const prepareInit = useCallback((): FilterInitResult => {
    if (!isStructureDataReady) {
      return { status: 'pending' };
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
    const filters = getFiltersPreselectedByDataQueries(
      filledDatasetFiltersMap,
      dataQueriesForMerge,
      structureDataMaps?.constraintsMap,
      datasetDimensionsMetadataMap,
    );
    return { status: 'ready', filters };
  }, [
    dataQueries,
    datasetDimensionsMetadataMap,
    isStructureDataReady,
    locale,
    structureDataMaps,
  ]);

  const remember = useCallback(() => {
    setInitialModalConstraintsMap(constraintsMapRef.current);
  }, []);

  const restore = useCallback(() => {
    constraintsMapRef.current = initialModalConstraintsMap;
  }, [initialModalConstraintsMap]);

  const getDeleteTargets = useCallback(
    (filter: Filter | undefined, targetDataQueries?: DataQuery[]) => {
      const dataQuery = targetDataQueries?.find(
        (q) => q?.urn === filter?.datasetUrn,
      );
      return !filter?.datasetUrn
        ? targetDataQueries
        : dataQuery
          ? [dataQuery]
          : [];
    },
    [],
  );

  const getClearTargets = useCallback(
    (targetDataQueries?: DataQuery[]) => targetDataQueries,
    [],
  );

  const constraints = useMemo<
    FilterConstraintsStrategy<MultiConstraintsResult>
  >(
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
    () => ({ prepareInit }),
    [prepareInit],
  );

  const controllerOptions = useMemo(
    () => ({
      initialConstraintsMap: structureDataMaps?.constraintsMap,
      datasetIcon,
      structuresMap: structureDataMaps?.structuresMap,
      dataQueries: displayDataQueries,
    }),
    [structureDataMaps, datasetIcon, displayDataQueries],
  );

  return {
    mode: 'multi',
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
  };
};
