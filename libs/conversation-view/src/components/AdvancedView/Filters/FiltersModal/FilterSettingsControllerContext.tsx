'use client';

import type {
  DataConstraints,
  Hierarchy,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import type { DataQuery, TimeRangeOptions } from '@epam/statgpt-shared-toolkit';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
} from 'react';
import type {
  Filter,
  FiltersModalProps,
  HierarchyState,
} from '../../../../models/filters';

export interface FilterSettingsState {
  filtersList: Filter[];
  selectedFilter?: Filter;
  isDisableValues?: boolean;
  isValuesLoading?: boolean;
  selectedTimeOption?: string | number;
  disabledDatasetUrns: Set<string>;
  timeSeriesCount?: string;
}

export interface FilterSettingsOptions {
  locale?: string;
  timeRangeOptions?: TimeRangeOptions[];
  modalProps?: FiltersModalProps;
  initialConstraints?: DataConstraints[];
  initialConstraintsMap?: Map<string, DataConstraints[] | undefined>;
  datasetIcon?: ReactNode;
  structuresMap?: Map<string, StructuralData | undefined>;
  dataQueries?: DataQuery[];
}

export interface FilterSettingsHandlers {
  setSelectedFilter: Dispatch<SetStateAction<Filter | undefined>>;
  onSelectDisplayMode: (filter?: Filter, displayMode?: string) => void;
  onDeleteFilter?: (filter?: Filter) => void;
  onClearAllFilters?: () => void;
  updateSelectedFilterValues?: (filter?: Filter) => void;
  onTimePeriodChange?: (value: string | number) => void;
  onToggleDataset: (urn: string, enabled: boolean) => void;
  onClearAllDatasets: () => void;
}

export interface FilterSettingsHierarchy {
  hierarchyStateMap?: Map<string, HierarchyState>;
  onSelectHierarchy?: (filter?: Filter, hierarchy?: Hierarchy | null) => void;
  onExpandHierarchyNode?: (filterKey: string, nodeId: string) => void;
}

export interface FilterSettingsController {
  state: FilterSettingsState;
  options: FilterSettingsOptions;
  handlers: FilterSettingsHandlers;
  hierarchy: FilterSettingsHierarchy;
}

const FilterSettingsControllerContext =
  createContext<FilterSettingsController | null>(null);

export function FilterSettingsControllerProvider({
  children,
  controller,
}: {
  children: ReactNode;
  controller: FilterSettingsController;
}) {
  return (
    <FilterSettingsControllerContext.Provider value={controller}>
      {children}
    </FilterSettingsControllerContext.Provider>
  );
}

export function useFilterSettingsController(): FilterSettingsController {
  const context = useContext(FilterSettingsControllerContext);
  if (!context) {
    throw new Error(
      'useFilterSettingsController must be used within FilterSettingsControllerProvider',
    );
  }
  return context;
}
