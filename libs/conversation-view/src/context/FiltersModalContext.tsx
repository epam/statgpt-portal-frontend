'use client';

import { createContext, ReactNode, useContext } from 'react';
import { Hierarchy } from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  TimeRange,
  TimeRangeOptions,
} from '@epam/statgpt-shared-toolkit';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValuesProps,
} from '../models/filters';

export interface FiltersModalContextValue {
  locale?: string;
  isDisableValues?: boolean;
  isValuesLoading?: boolean;
  timeRangeOptions?: TimeRangeOptions[];
  filterValuesProps?: FilterValuesProps;
  dataQueries?: DataQuery[];
  onSelectHierarchy?: (filter?: Filter, hierarchy?: Hierarchy | null) => void;
  selectFilterValue: (
    id: string,
    isSelectedValue?: boolean,
    filter?: Filter,
  ) => void;
  selectHierarchicalNodes: (
    nodes?: FilterTreeNodeProps[],
    filter?: Filter,
  ) => void;
  expandHierarchicalValue: (
    value?: FilterTreeNodeProps,
    filter?: Filter,
  ) => void;
  onTimePeriodChange: (
    timeRange: TimeRange | null,
    selectedOption: string | number,
  ) => void;
}

const FiltersModalContext = createContext<FiltersModalContextValue | null>(
  null,
);

export function FiltersModalProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FiltersModalContextValue;
}) {
  return (
    <FiltersModalContext.Provider value={value}>
      {children}
    </FiltersModalContext.Provider>
  );
}

export function useFiltersModal(): FiltersModalContextValue {
  const context = useContext(FiltersModalContext);
  if (!context) {
    throw new Error('useFiltersModal must be used within FiltersModalProvider');
  }
  return context;
}
