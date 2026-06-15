'use client';

import { PopUpState } from '@epam/statgpt-ui-components';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Filter,
  FiltersProps,
  HierarchyState,
} from '../../../../models/filters';
import {
  getFilterIdentity,
  getSelectedFilterValues,
  isSameFilter,
  updateFiltersWithDisplayMode,
  updateFiltersWithSelectedItem,
} from '../../../../utils/filters';

interface UseMultiDatasetFilterModalStateParams {
  modalState: PopUpState;
  dataQueries?: FiltersProps['dataQueries'];
  hierarchyStateMap: Map<string, HierarchyState>;
  loadAvailableHierarchies: (filter: Filter) => void | Promise<void>;
}

export const useMultiDatasetFilterModalState = ({
  modalState,
  dataQueries,
  hierarchyStateMap,
  loadAvailableHierarchies,
}: UseMultiDatasetFilterModalStateParams) => {
  const [modalFilters, setModalFilters] = useState<Filter[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Filter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter>();
  const [selectedFilterValues, setSelectedFilterValues] = useState<Filter[]>(
    [],
  );
  const [selectedTimeOption, setSelectedTimeOption] = useState<
    string | number | undefined
  >(undefined);
  const [disabledDatasetUrns, setDisabledDatasetUrns] = useState<Set<string>>(
    new Set(),
  );
  const [appliedDisabledUrns, setAppliedDisabledUrns] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (appliedFilters?.length) {
      setSelectedFilterValues(getSelectedFilterValues(appliedFilters));
    }
  }, [appliedFilters]);

  useEffect(() => {
    setModalFilters((prevFilters) =>
      updateFiltersWithSelectedItem(prevFilters, selectedFilter),
    );
  }, [selectedFilter]);

  useEffect(() => {
    if (modalState === PopUpState.Opened) {
      setSelectedTimeOption(void 0);
      const firstFilter = appliedFilters.find((f) => !f.isTimeDimension);
      setSelectedFilter(
        firstFilter ? { ...firstFilter, isSelectedFilter: true } : void 0,
      );
      setModalFilters(appliedFilters);
      const initialDisabled = new Set(
        dataQueries?.filter((q) => q.disabled).map((q) => q.urn),
      );
      setDisabledDatasetUrns(initialDisabled);
      setAppliedDisabledUrns(initialDisabled);
    }
    if (modalState === PopUpState.Closed) {
      setSelectedFilter(void 0);
    }
  }, [appliedFilters, dataQueries, modalState]);

  useEffect(() => {
    if (!selectedFilter || selectedFilter.isTimeDimension) {
      return;
    }

    const filterKey = getFilterIdentity(selectedFilter);
    if (!filterKey) return;
    const existingState = hierarchyStateMap.get(filterKey);

    if (!existingState) {
      loadAvailableHierarchies(selectedFilter);
    }
  }, [selectedFilter, hierarchyStateMap, loadAvailableHierarchies]);

  useEffect(() => {
    if (modalState !== PopUpState.Opened) return;

    appliedFilters.forEach((filter) => {
      if (filter.isTimeDimension) return;
      const filterKey = getFilterIdentity(filter);
      if (filterKey && !hierarchyStateMap.has(filterKey)) {
        loadAvailableHierarchies(filter);
      }
    });
  }, [modalState, appliedFilters, hierarchyStateMap, loadAvailableHierarchies]);

  const onSelectDisplayMode = useCallback(
    (filter?: Filter, displayMode?: string) => {
      setModalFilters((prevFilters) =>
        updateFiltersWithDisplayMode(prevFilters, filter, displayMode),
      );
      if (isSameFilter(selectedFilter, filter)) {
        setSelectedFilter((prevFilter) =>
          prevFilter
            ? {
                ...prevFilter,
                displayMode,
              }
            : prevFilter,
        );
      }
    },
    [selectedFilter],
  );

  const onClearAllDatasets = useCallback(() => {
    setDisabledDatasetUrns(new Set());
  }, []);

  const onToggleDataset = useCallback((urn: string, enabled: boolean) => {
    setDisabledDatasetUrns((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.delete(urn);
      } else {
        next.add(urn);
      }
      return next;
    });
  }, []);

  const onTimePeriodChange = useCallback((value: string | number) => {
    setSelectedTimeOption(value);
  }, []);

  return {
    modalFilters,
    setModalFilters,
    appliedFilters,
    setAppliedFilters,
    selectedFilter,
    setSelectedFilter,
    selectedFilterValues,
    selectedTimeOption,
    disabledDatasetUrns,
    appliedDisabledUrns,
    onSelectDisplayMode,
    onClearAllDatasets,
    onToggleDataset,
    onTimePeriodChange,
  } satisfies {
    modalFilters: Filter[];
    setModalFilters: Dispatch<SetStateAction<Filter[]>>;
    appliedFilters: Filter[];
    setAppliedFilters: Dispatch<SetStateAction<Filter[]>>;
    selectedFilter: Filter | undefined;
    setSelectedFilter: Dispatch<SetStateAction<Filter | undefined>>;
    selectedFilterValues: Filter[];
    selectedTimeOption: string | number | undefined;
    disabledDatasetUrns: Set<string>;
    appliedDisabledUrns: Set<string>;
    onSelectDisplayMode: (filter?: Filter, displayMode?: string) => void;
    onClearAllDatasets: () => void;
    onToggleDataset: (urn: string, enabled: boolean) => void;
    onTimePeriodChange: (value: string | number) => void;
  };
};
