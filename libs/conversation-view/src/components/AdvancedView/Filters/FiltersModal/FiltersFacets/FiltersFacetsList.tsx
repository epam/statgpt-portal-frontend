'use client';

import { DataConstraints, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { TimeRange, TimeRangeOptions } from '@epam/statgpt-shared-toolkit';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValuesProps,
} from '../../../../../models/filters';
import { ConversationViewTitles } from '../../../../../models/titles';
import FiltersFacetItem from './FiltersFacetItem';
import { getDatasetNameFromFilters } from '../../../../../utils/multiple-filters';

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
  datasetIcon?: ReactNode;
  structuresMap?: Map<string, StructuralData | undefined>;
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
  datasetIcon,
  structuresMap,
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
          datasetIcon={datasetIcon}
          datasetName={getDatasetNameFromFilters(filter, structuresMap)}
        />
      ))}
    </div>
  );
};

export default FiltersFacetsList;
