'use client';

import { PopUpState } from '@epam/statgpt-ui-components';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Filter, HierarchyState } from '../../../../models/filters';
import {
  getFilterIdentity,
  getSelectedFilterValues,
  isSameFilter,
  updateFiltersWithDisplayMode,
  updateFiltersWithSelectedItem,
} from '../../../../utils/filters';

interface UseSingleDatasetFilterModalStateParams {
  modalState: PopUpState;
  hierarchyStateMap: Map<string, HierarchyState>;
  loadAvailableHierarchies: (filter: Filter) => void | Promise<void>;
}

export const useSingleDatasetFilterModalState = ({
  modalState,
  hierarchyStateMap,
  loadAvailableHierarchies,
}: UseSingleDatasetFilterModalStateParams) => {
  const [modalFilters, setModalFilters] = useState<Filter[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Filter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter>();
  const [selectedFilterValues, setSelectedFilterValues] = useState<Filter[]>(
    [],
  );
  const [selectedTimeOption, setSelectedTimeOption] = useState<
    string | number | undefined
  >(undefined);

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
      const firstFilter = appliedFilters.find((f) => !f.isTimeDimension);
      setSelectedFilter(
        firstFilter ? { ...firstFilter, isSelectedFilter: true } : void 0,
      );
      setModalFilters(appliedFilters);
    }
    if (modalState === PopUpState.Closed) {
      setSelectedFilter(void 0);
    }
  }, [appliedFilters, modalState]);

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
    onSelectDisplayMode,
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
    onSelectDisplayMode: (filter?: Filter, displayMode?: string) => void;
    onTimePeriodChange: (value: string | number) => void;
  };
};
