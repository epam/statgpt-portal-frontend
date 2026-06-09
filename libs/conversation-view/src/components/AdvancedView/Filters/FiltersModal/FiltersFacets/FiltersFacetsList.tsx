'use client';

import { DataConstraints, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';
import { Filter, HierarchyState } from '../../../../../models/filters';
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
  onSelectFilter: (filter?: Filter) => void;
  onDeleteFilter?: (filter?: Filter) => void;
  onSelectDisplayMode?: (filter?: Filter, displayMode?: string) => void;
  initialConstraints?: DataConstraints[];
  initialConstraintsMap?: Map<string, DataConstraints[] | undefined>;
  datasetIcon?: ReactNode;
  structuresMap?: Map<string, StructuralData | undefined>;
  hierarchyStateMap?: Map<string, HierarchyState>;
  dataQueries?: DataQuery[];
  disabledDatasetUrns?: Set<string>;
  isDatasetFacetSelected?: boolean;
  onSelectDatasetFacet: () => void;
  onClearAllDatasets: () => void;
}

const FiltersFacetsList: FC<Props> = ({
  filtersList,
  hideFacetCounterByDefault,
  onSelectFilter,
  onDeleteFilter,
  onSelectDisplayMode,
  initialConstraints,
  initialConstraintsMap,
  datasetIcon,
  structuresMap,
  hierarchyStateMap,
  dataQueries,
  disabledDatasetUrns = EMPTY_DISABLED_SET,
  isDatasetFacetSelected = false,
  onSelectDatasetFacet,
  onClearAllDatasets,
}) => {
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const shouldShowDatasetSelector =
    isCrossDatasetModeOn && !!dataQueries?.length;
  const datasetCount = new Set(
    filtersList
      .filter((filter) => filter.filterType === 'dataset')
      .map((filter) => filter.datasetUrn || ''),
  ).size;

  return (
    <div
      className={classNames(
        'overflow-y-auto advanced-view-filters-list w-[338px] pr-3 h-full sm:w-full',
      )}
    >
      {shouldShowDatasetSelector && (
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
            <div key={getFilterIdentity(filter)} className="min-w-0 shrink-0">
              {datasetName && (
                <h4 className="filters-facet-dataset-name !flex">
                  <span className="filters-facet-dataset-icon">
                    {datasetIcon}
                  </span>
                  <span className="min-w-0 truncate" title={datasetName}>
                    {datasetName}
                  </span>
                </h4>
              )}

              <FiltersFacetItem
                filtersList={filteredList}
                filter={filter}
                onSelectFilter={onSelectFilter}
                onSelectDisplayMode={onSelectDisplayMode}
                onDeleteFilter={onDeleteFilter}
                hideFacetCounterByDefault={hideFacetCounterByDefault}
                initialConstraints={getInitialConstraints(
                  isCrossDatasetModeOn,
                  filter,
                  initialConstraints,
                  initialConstraintsMap,
                )}
                hierarchyState={hierarchyStateMap?.get(
                  getFilterIdentity(filter) ?? '',
                )}
              />
            </div>
          );
        })}
    </div>
  );
};

export default FiltersFacetsList;
