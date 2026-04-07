'use client';

import {
  DataConstraints,
  Hierarchy,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { TimeRange, TimeRangeOptions } from '@epam/statgpt-shared-toolkit';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValuesProps,
  HierarchyState,
} from '../../../../../models/filters';
import { ConversationViewTitles } from '../../../../../models/titles';
import FiltersFacetItem from './FiltersFacetItem';
import { getFilterIdentity } from '../../../../../utils/filters';
import {
  getDatasetNameFromFilters,
  getInitialConstraints,
} from '../../../../../utils/multiple-filters';
import { useConversationViewFeatureToggles } from '../../../../../context/ConversationViewFeatureTogglesContext';

interface Props {
  filtersList: Filter[];
  hideFacetCounterByDefault?: boolean;
  locale?: string;
  onSelectFilter: (filter?: Filter) => void;
  onDeleteFilter?: (filter?: Filter) => void;
  onSelectDisplayMode?: (filter?: Filter, displayMode?: string) => void;
  filterValuesProps?: FilterValuesProps;
  isDisableValues?: boolean;
  timeRangeOptions?: TimeRangeOptions[];
  titles?: ConversationViewTitles;
  initialConstraints?: DataConstraints[];
  initialConstraintsMap?: Map<string, DataConstraints[] | undefined>;
  datasetIcon?: ReactNode;
  structuresMap?: Map<string, StructuralData | undefined>;
  onTimePeriodChange: (
    timeRange: TimeRange | null,
    selectedOption: string | number,
  ) => void;
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
  hierarchyStateMap?: Map<string, HierarchyState>;
  onSelectHierarchy?: (filter?: Filter, hierarchy?: Hierarchy | null) => void;
}

const FiltersFacetsList: FC<Props> = ({
  filtersList,
  hideFacetCounterByDefault,
  locale,
  onSelectFilter,
  onDeleteFilter,
  onSelectDisplayMode,
  filterValuesProps,
  isDisableValues,
  timeRangeOptions,
  initialConstraints,
  initialConstraintsMap,
  datasetIcon,
  structuresMap,
  onTimePeriodChange,
  selectFilterValue,
  selectHierarchicalNodes,
  titles,
  expandHierarchicalValue,
  hierarchyStateMap,
  onSelectHierarchy,
}) => {
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  return (
    <div
      className={classNames(
        'overflow-y-auto advanced-view-filters-list min-w-[320px] pr-3 h-full sm:w-full',
      )}
    >
      {filtersList?.map((filter) => (
        <FiltersFacetItem
          filtersList={filtersList}
          titles={titles}
          locale={locale}
          filter={filter}
          key={getFilterIdentity(filter)}
          onSelectFilter={onSelectFilter}
          onSelectDisplayMode={onSelectDisplayMode}
          onDeleteFilter={onDeleteFilter}
          hideFacetCounterByDefault={hideFacetCounterByDefault}
          isDisableValues={isDisableValues}
          timeRangeOptions={timeRangeOptions}
          selectFilterValue={selectFilterValue}
          selectHierarchicalNodes={selectHierarchicalNodes}
          expandHierarchicalValue={expandHierarchicalValue}
          onTimePeriodChange={onTimePeriodChange}
          filterValuesProps={filterValuesProps}
          initialConstraints={getInitialConstraints(
            isCrossDatasetModeOn,
            filter,
            initialConstraints,
            initialConstraintsMap,
          )}
          datasetIcon={datasetIcon}
          datasetName={
            (structuresMap?.size ?? 0) > 1
              ? getDatasetNameFromFilters(filter, structuresMap)
              : undefined
          }
          hierarchyState={hierarchyStateMap?.get(
            getFilterIdentity(filter) ?? '',
          )}
          onSelectHierarchy={onSelectHierarchy}
        />
      ))}
    </div>
  );
};

export default FiltersFacetsList;
