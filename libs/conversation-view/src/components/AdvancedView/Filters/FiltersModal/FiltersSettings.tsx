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
import { Button, useIsMobile } from '@epam/statgpt-ui-components';
import { FC, ReactNode, useCallback } from 'react';
import {
  Filter,
  FiltersModalProps,
  FilterTreeNodeProps,
  FilterValue,
  HierarchyState,
} from '../../../../models/filters';
import FiltersFacetsList from './FiltersFacets/FiltersFacetsList';
import FiltersValuesPanel from './FiltersValuesPanel/FiltersValuesPanel';
import classNames from 'classnames';
import { useConversationViewStyles } from '../../../../context/ConversationViewStylesContext';
import {
  getFilterIdentity,
  getNewHierarchyFilterValues,
  isSharedFilter,
  getSelectedFilterValues,
  getTotalSelectedValuesLength,
  isSameFilter,
} from '../../../../utils/filters';
import { useConversationViewFeatureToggles } from '../../../../context/ConversationViewFeatureTogglesContext';
import { getInitialConstraints } from '../../../../utils/multiple-filters';
import { FiltersModalProvider } from '../../../../context/FiltersModalContext';
import {
  mapHierarchyNodeIdToFilterValueId,
  mapHierarchyNodesToFilterValueIds,
} from '../../../../utils/hierarchy-view';

interface Props {
  filtersList: Filter[];
  selectedFilter?: Filter;
  locale?: string;
  isDisableValues?: boolean;
  isValuesLoading?: boolean;
  timeSeriesCount?: string;
  timeRangeOptions?: TimeRangeOptions[];
  modalProps?: FiltersModalProps;
  initialConstraints?: DataConstraints[];
  initialConstraintsMap?: Map<string, DataConstraints[] | undefined>;
  datasetIcon?: ReactNode;
  structuresMap?: Map<string, StructuralData | undefined>;
  setSelectedFilter: (filter?: Filter) => void;
  onSelectDisplayMode: (filter?: Filter, displayMode?: string) => void;
  onDeleteFilter?: (filter?: Filter) => void;
  onClearAllFilters?: () => void;
  updateSelectedFilterValues?: (filter: Filter) => void;
  onTimePeriodChange?: (value: string | number) => void;
  selectedTimeOption?: string | number;
  hierarchyStateMap?: Map<string, HierarchyState>;
  onSelectHierarchy?: (filter?: Filter, hierarchy?: Hierarchy | null) => void;
  onExpandHierarchyNode?: (filterKey: string, nodeId: string) => void;
  dataQueries?: DataQuery[];
}

const FilterSettings: FC<Props> = ({
  filtersList,
  selectedFilter,
  modalProps,
  locale,
  isDisableValues,
  isValuesLoading,
  timeSeriesCount,
  timeRangeOptions,
  initialConstraints,
  initialConstraintsMap,
  datasetIcon,
  structuresMap,
  setSelectedFilter,
  onSelectDisplayMode,
  onDeleteFilter,
  onClearAllFilters,
  updateSelectedFilterValues,
  onTimePeriodChange,
  selectedTimeOption,
  hierarchyStateMap,
  onSelectHierarchy,
  onExpandHierarchyNode,
  dataQueries,
}) => {
  const { titles } = useConversationViewStyles();
  const hierarchyState = hierarchyStateMap?.get(
    getFilterIdentity(selectedFilter) as string,
  );
  const isMobile = useIsMobile();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const allAppliedFilters = getTotalSelectedValuesLength(
    getSelectedFilterValues(filtersList),
  );

  const onSelectFilter = useCallback(
    (currentFilter?: Filter) => {
      const foundFilter = filtersList?.find((filter) =>
        isSameFilter(filter, currentFilter),
      );

      if (!foundFilter) {
        setSelectedFilter(void 0);
        return;
      }

      setSelectedFilter({
        ...foundFilter,
        isSelectedFilter: true,
      });
    },
    [filtersList, setSelectedFilter],
  );

  const onSelectFilterValue = (
    id: string,
    isSelectedValue?: boolean,
    targetFilter?: Filter,
  ) => {
    const filterToUpdate = targetFilter || selectedFilter;
    const shouldUpdateSelectedFilter =
      !targetFilter || isSameFilter(targetFilter, selectedFilter);

    if (!filterToUpdate) {
      return;
    }

    const resolvedId = isSharedFilter(filterToUpdate)
      ? mapHierarchyNodeIdToFilterValueId(id, filterToUpdate)
      : id;

    if (!resolvedId) {
      return;
    }

    const updatedFilter = {
      ...filterToUpdate,
      dimensionValues: filterToUpdate?.dimensionValues?.map(
        (dimensionValue) => {
          if (dimensionValue?.id === resolvedId) {
            return { ...dimensionValue, isSelectedValue };
          }
          return dimensionValue;
        },
      ),
    };
    if (shouldUpdateSelectedFilter) {
      setSelectedFilter(updatedFilter);
    }
    if (updateSelectedFilterValues) {
      updateSelectedFilterValues(updatedFilter);
    }
  };

  const onSelectHierarchicalNodes = (
    nodes?: FilterTreeNodeProps[],
    targetFilter?: Filter,
  ) => {
    const filterToUpdate = targetFilter || selectedFilter;
    const shouldUpdateSelectedFilter =
      !targetFilter || isSameFilter(targetFilter, selectedFilter);

    if (!filterToUpdate) {
      return;
    }

    const mappedNodes = isSharedFilter(filterToUpdate)
      ? mapHierarchyNodesToFilterValueIds(nodes, filterToUpdate)
      : (nodes ?? []);

    // Add entries for nodes that aren't yet part of dimensionValues
    // so their selection can be persisted.
    const existingIds = new Set(
      filterToUpdate?.dimensionValues?.map((v) => v.id),
    );
    const newEntries: FilterValue[] = isSharedFilter(filterToUpdate)
      ? []
      : getNewHierarchyFilterValues(mappedNodes, existingIds);

    const updatedFilter = {
      ...filterToUpdate,
      dimensionValues: [
        ...(filterToUpdate?.dimensionValues?.map((dimensionValue) => {
          const nodeValue = mappedNodes.find(
            (node) => node?.id === dimensionValue?.id,
          );
          return nodeValue
            ? { ...dimensionValue, isSelectedValue: nodeValue.isSelectedValue }
            : dimensionValue;
        }) ?? []),
        ...newEntries,
      ],
    };
    if (shouldUpdateSelectedFilter) {
      setSelectedFilter(updatedFilter);
    }

    if (updateSelectedFilterValues) {
      updateSelectedFilterValues(updatedFilter);
    }
  };

  const onExpandHierarchicalValue = (
    node?: FilterTreeNodeProps,
    targetFilter?: Filter,
  ) => {
    const filterToUpdate = targetFilter || selectedFilter;
    const shouldUpdateSelectedFilter =
      !targetFilter || isSameFilter(targetFilter, selectedFilter);

    if (!filterToUpdate || !node?.id) {
      return;
    }

    const filterKey = getFilterIdentity(filterToUpdate);
    const targetHierarchyState = filterKey
      ? hierarchyStateMap?.get(filterKey)
      : undefined;

    if (targetHierarchyState?.treeNodes?.length) {
      onExpandHierarchyNode?.(filterKey as string, node.id);
      return;
    }

    const updatedFilter = {
      ...filterToUpdate,
      dimensionValues: filterToUpdate?.dimensionValues?.map(
        (dimensionValue) => {
          if (dimensionValue?.id === node?.id) {
            return { ...dimensionValue, isExpanded: !node?.isExpanded };
          }
          return dimensionValue;
        },
      ),
    };

    if (shouldUpdateSelectedFilter) {
      setSelectedFilter(updatedFilter);
    }
    if (updateSelectedFilterValues) {
      updateSelectedFilterValues(updatedFilter);
    }
  };

  const onSelectTimePeriodValue = (
    timeRange: TimeRange | null,
    selectedOption: string | number,
  ) => {
    if (!selectedFilter) {
      return;
    }

    const updatedFilter = {
      ...selectedFilter,
      timeRange: timeRange || void 0,
    };
    onTimePeriodChange?.(selectedOption);
    setSelectedFilter(updatedFilter);
    if (updateSelectedFilterValues) {
      updateSelectedFilterValues(updatedFilter);
    }
  };

  return (
    <FiltersModalProvider
      value={{
        locale,
        isDisableValues,
        isValuesLoading,
        timeRangeOptions,
        filterValuesProps: modalProps?.filterValuesProps,
        dataQueries,
        onSelectHierarchy,
        selectFilterValue: onSelectFilterValue,
        selectHierarchicalNodes: onSelectHierarchicalNodes,
        expandHierarchicalValue: onExpandHierarchicalValue,
        onTimePeriodChange: onSelectTimePeriodValue,
      }}
    >
      <div
        className={classNames(
          'flex flex-row gap-5 flex-1 min-h-0 sm:p-0',
          'filters-settings',
        )}
      >
        <div
          className={classNames(
            'h-full sm:w-full',
            modalProps?.isShowTimeSeriesCount &&
              'flex flex-col justify-between',
          )}
        >
          {isCrossDatasetModeOn && (
            <div className="mb-4 flex items-center justify-between gap-x-4">
              <span className="body-3 text-neutrals-900">
                {titles?.appliedFilters ?? 'Applied filters'}:{' '}
                {allAppliedFilters}
              </span>
              <Button
                buttonClassName="text-button-tertiary p-0"
                title={titles?.clearAll ?? 'Clear All'}
                onClick={onClearAllFilters}
                isSmallButton={isMobile}
              />
            </div>
          )}
          <FiltersFacetsList
            filtersList={filtersList}
            hideFacetCounterByDefault={modalProps?.isHideFacetCounterByDefault}
            onSelectFilter={onSelectFilter}
            onSelectDisplayMode={onSelectDisplayMode}
            onDeleteFilter={onDeleteFilter}
            initialConstraints={initialConstraints}
            initialConstraintsMap={initialConstraintsMap}
            datasetIcon={datasetIcon}
            structuresMap={structuresMap}
            hierarchyStateMap={hierarchyStateMap}
          />
          {modalProps?.isShowTimeSeriesCount && timeSeriesCount ? (
            <h4 className="my-4 text-neutrals-800">
              {titles?.timeSeries ?? 'Timeseries'}: {timeSeriesCount}
            </h4>
          ) : null}
        </div>
        {!isMobile && (
          <FiltersValuesPanel
            filtersList={filtersList}
            selectedFilter={selectedFilter}
            structuresMap={structuresMap}
            initialConstraints={getInitialConstraints(
              isCrossDatasetModeOn,
              selectedFilter,
              initialConstraints,
              initialConstraintsMap,
            )}
            selectedTimeOption={selectedTimeOption}
            hierarchyState={hierarchyState}
          />
        )}
      </div>
    </FiltersModalProvider>
  );
};

export default FilterSettings;
