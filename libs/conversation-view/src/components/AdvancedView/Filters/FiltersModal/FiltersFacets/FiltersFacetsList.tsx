'use client';

import { FC } from 'react';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValuesProps,
} from '../../../../../models/filters';
import FiltersFacetItem from './FiltersFacetItem';
import classNames from 'classnames';
import { TimeRangeOptions } from '@statgpt/shared-toolkit/src/models/time-range';
import { TimeRange } from '@statgpt/shared-toolkit/src/models/time-range';
import { ConversationViewTitles } from '../../../../../models/titles';
import { DataConstraints } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/constraints';

interface Props {
  filtersList: Filter[];
  hideFacetCounterByDefault?: boolean;
  locale?: string;
  onSelectFilter: (filterId?: string) => void;
  onDeleteFilter?: (filterId?: string) => void;
  onSelectDisplayMode?: (filterId?: string, displayMode?: string) => void;
  filterValuesProps?: FilterValuesProps;
  isDisableValues?: boolean;
  timeRangeOptions?: TimeRangeOptions[];
  titles?: ConversationViewTitles;
  initialConstraints?: DataConstraints[];
  onTimePeriodChange: (
    timeRange: TimeRange | null,
    selectedOption: string | number,
  ) => void;
  selectFilterValue: (id: string, isSelectedValue?: boolean) => void;
  selectHierarchicalNodes: (nodes?: FilterTreeNodeProps[]) => void;
  expandHierarchicalValue: (value?: FilterTreeNodeProps) => void;
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
  onTimePeriodChange,
  selectFilterValue,
  selectHierarchicalNodes,
  titles,
  expandHierarchicalValue,
}) => {
  return (
    <div
      className={classNames(
        'overflow-y-auto advanced-view-filters-list min-w-[320px] pr-3 h-full sm:w-full',
      )}
    >
      {filtersList?.map((filter) => (
        <FiltersFacetItem
          titles={titles}
          locale={locale}
          filter={filter}
          key={filter?.id}
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
          initialConstraints={initialConstraints}
        />
      ))}
    </div>
  );
};

export default FiltersFacetsList;
