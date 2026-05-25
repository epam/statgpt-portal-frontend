'use client';

import {
  DataConstraints,
  Hierarchy,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  TimeRange,
  TimeRangeOptions,
} from '@epam/statgpt-shared-toolkit';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValuesProps,
  HierarchyState,
} from '../../../../../models/filters';
import { DatasetSelectorFacet } from './DatasetSelectorFacet';
import FiltersFacetItem from './FiltersFacetItem';
import { getFilterIdentity } from '../../../../../utils/filters';
import {
  getDatasetNameFromFilters,
  getInitialConstraints,
} from '../../../../../utils/multiple-filters';
import { useConversationViewFeatureToggles } from '../../../../../context/ConversationViewFeatureTogglesContext';

const EMPTY_DISABLED_SET = new Set<string>();

interface Props {
  filtersList: Filter[];
  hideFacetCounterByDefault?: boolean;
  locale?: string;
  onSelectFilter: (filter?: Filter) => void;
  onDeleteFilter?: (filter?: Filter) => void;
  onSelectDisplayMode?: (filter?: Filter, displayMode?: string) => void;
  filterValuesProps?: FilterValuesProps;
  isDisableValues?: boolean;
  isValuesLoading?: boolean;
  timeRangeOptions?: TimeRangeOptions[];
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
  dataQueries?: DataQuery[];
  disabledDatasetUrns?: Set<string>;
  isDatasetFacetSelected?: boolean;
  onSelectDatasetFacet: () => void;
  onClearAllDatasets: () => void;
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
  isValuesLoading,
  timeRangeOptions,
  initialConstraints,
  initialConstraintsMap,
  datasetIcon,
  structuresMap,
  onTimePeriodChange,
  selectFilterValue,
  selectHierarchicalNodes,
  expandHierarchicalValue,
  hierarchyStateMap,
  onSelectHierarchy,
  dataQueries,
  disabledDatasetUrns = EMPTY_DISABLED_SET,
  isDatasetFacetSelected = false,
  onSelectDatasetFacet,
  onClearAllDatasets,
}) => {
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const datasetCount = new Set(
    filtersList
      .filter((filter) => filter.filterType === 'dataset')
      .map((filter) => filter.datasetUrn || ''),
  ).size;

  return (
    <div
      className={classNames(
        'overflow-y-auto advanced-view-filters-list min-w-[320px] pr-3 h-full sm:w-full',
      )}
    >
      {dataQueries && dataQueries.length > 0 && (
        <DatasetSelectorFacet
          dataQueries={dataQueries}
          disabledDatasetUrns={disabledDatasetUrns}
          isSelected={isDatasetFacetSelected}
          onSelect={onSelectDatasetFacet}
          onClearAll={onClearAllDatasets}
        />
      )}
      {filtersList
        .filter(
          (filter) =>
            !(
              filter.filterType === 'dataset' &&
              filter.datasetUrn &&
              disabledDatasetUrns.has(filter.datasetUrn)
            ),
        )
        .map((filter, index, filteredList) => {
          const previousFilter = filteredList[index - 1];
          const shouldRenderDatasetTitle =
            filter.filterType === 'dataset' &&
            datasetCount > 1 &&
            filter.datasetUrn !== previousFilter?.datasetUrn;
          const datasetName = shouldRenderDatasetTitle
            ? getDatasetNameFromFilters(filter, structuresMap)
            : undefined;

          return (
            <div key={getFilterIdentity(filter)}>
              {datasetName && (
                <h4 className="filters-facet-dataset-name">
                  <span className="filters-facet-dataset-icon">
                    {datasetIcon}
                  </span>
                  {datasetName}
                </h4>
              )}

              <FiltersFacetItem
                filtersList={filteredList}
                locale={locale}
                filter={filter}
                onSelectFilter={onSelectFilter}
                onSelectDisplayMode={onSelectDisplayMode}
                onDeleteFilter={onDeleteFilter}
                hideFacetCounterByDefault={hideFacetCounterByDefault}
                isDisableValues={isDisableValues}
                isValuesLoading={isValuesLoading}
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
                hierarchyState={hierarchyStateMap?.get(
                  getFilterIdentity(filter) ?? '',
                )}
                onSelectHierarchy={onSelectHierarchy}
                dataQueries={dataQueries}
              />
            </div>
          );
        })}
    </div>
  );
};

export default FiltersFacetsList;
