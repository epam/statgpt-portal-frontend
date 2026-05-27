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
import { FC, ReactNode, useCallback, useMemo, useState } from 'react';
import {
  Filter,
  FiltersModalProps,
  FilterTreeNodeProps,
  FilterValue,
  HierarchyState,
} from '../../../../models/filters';
import FiltersFacetsList from './FiltersFacets/FiltersFacetsList';
import FiltersValuesPanel from './FiltersValuesPanel/FiltersValuesPanel';
import { DatasetValuesPanel } from './FiltersValuesPanel/DatasetValuesPanel';
import classNames from 'classnames';
import { useConversationViewStyles } from '../../../../context/ConversationViewStylesContext';
import {
  getFilterIdentity,
  isSharedFilter,
  getSelectedFilterValues,
  getTotalSelectedValuesLength,
  isSameFilter,
} from '../../../../utils/filters';
import { useConversationViewFeatureToggles } from '../../../../context/ConversationViewFeatureTogglesContext';
import {
  filterSharedValuesForEnabledDatasets,
  getInitialConstraints,
} from '../../../../utils/multiple-filters';
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
  disabledDatasetUrns: Set<string>;
  onToggleDataset: (urn: string, enabled: boolean) => void;
  onClearAllDatasets: () => void;
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
  disabledDatasetUrns,
  onToggleDataset,
  onClearAllDatasets,
}) => {
  const { titles } = useConversationViewStyles();
  const hierarchyState = hierarchyStateMap?.get(
    getFilterIdentity(selectedFilter) as string,
  );
  const isMobile = useIsMobile();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const [isDatasetFacetSelected, setIsDatasetFacetSelected] = useState(true);
  // Combines: (1) hide disabled-dataset DatasetFilter facets (existing),
  //           (2) hide SharedFilter values whose sources are all disabled (new),
  //           (3) clip Time Period range to enabled datasets (new).
  const displayFilters = useMemo(
    () =>
      filterSharedValuesForEnabledDatasets(
        filtersList.filter(
          (filter) =>
            !(
              filter.filterType === 'dataset' &&
              filter.datasetUrn &&
              disabledDatasetUrns.has(filter.datasetUrn)
            ),
        ),
        disabledDatasetUrns,
        initialConstraintsMap,
      ),
    [filtersList, disabledDatasetUrns, initialConstraintsMap],
  );

  // Display-only version of the selected filter — filtered dimensionValues and
  // clipped timeRange. State update callbacks still close over the full
  // `selectedFilter` prop so hidden values are never lost.
  const displaySelectedFilter = useMemo(
    () =>
      selectedFilter
        ? displayFilters.find((f) => isSameFilter(f, selectedFilter))
        : undefined,
    [selectedFilter, displayFilters],
  );
  const allAppliedFilters =
    getTotalSelectedValuesLength(getSelectedFilterValues(filtersList)) +
    disabledDatasetUrns.size;

  const onSelectDatasetFacet = useCallback(() => {
    setIsDatasetFacetSelected(true);
    setSelectedFilter(void 0);
  }, [setSelectedFilter]);

  const onSelectFilter = useCallback(
    (currentFilter?: Filter) => {
      setIsDatasetFacetSelected(false);
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

  const getFullFilter = (filter: Filter | undefined): Filter | undefined =>
    filter ? filtersList?.find((f) => isSameFilter(f, filter)) : undefined;

  const onSelectFilterValue = (
    id: string,
    isSelectedValue?: boolean,
    targetFilter?: Filter,
  ) => {
    const shouldUpdateSelectedFilter =
      !targetFilter || isSameFilter(targetFilter, selectedFilter);

    const filterToUpdate =
      getFullFilter(targetFilter ?? selectedFilter) ??
      targetFilter ??
      selectedFilter;

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
    const shouldUpdateSelectedFilter =
      !targetFilter || isSameFilter(targetFilter, selectedFilter);

    const filterToUpdate =
      getFullFilter(targetFilter ?? selectedFilter) ??
      targetFilter ??
      selectedFilter;

    if (!filterToUpdate) {
      return;
    }

    const mappedNodes = isSharedFilter(filterToUpdate)
      ? mapHierarchyNodesToFilterValueIds(nodes, filterToUpdate)
      : (nodes ?? []);

    // For single-node calls (nodes with all-disabled children that are not yet
    // in dimensionValues), add the node as a new entry so it can be selected.
    const existingIds = new Set(
      filterToUpdate?.dimensionValues?.map((v) => v.id),
    );
    const newEntries: FilterValue[] =
      !isSharedFilter(filterToUpdate) &&
      mappedNodes.length === 1 &&
      mappedNodes[0] &&
      !existingIds.has(mappedNodes[0].id)
        ? [
            {
              id: mappedNodes[0].id,
              name: mappedNodes[0].name,
              isSelectedValue: mappedNodes[0].isSelectedValue,
            },
          ]
        : [];

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
    const shouldUpdateSelectedFilter =
      !targetFilter || isSameFilter(targetFilter, selectedFilter);

    const filterToUpdate =
      getFullFilter(targetFilter ?? selectedFilter) ??
      targetFilter ??
      selectedFilter;

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
            filtersList={displayFilters}
            hideFacetCounterByDefault={modalProps?.isHideFacetCounterByDefault}
            onSelectFilter={onSelectFilter}
            onSelectDisplayMode={onSelectDisplayMode}
            onDeleteFilter={onDeleteFilter}
            initialConstraints={initialConstraints}
            initialConstraintsMap={initialConstraintsMap}
            datasetIcon={datasetIcon}
            structuresMap={structuresMap}
            hierarchyStateMap={hierarchyStateMap}
            dataQueries={dataQueries}
            disabledDatasetUrns={disabledDatasetUrns}
            isDatasetFacetSelected={isDatasetFacetSelected}
            onSelectDatasetFacet={onSelectDatasetFacet}
            onClearAllDatasets={onClearAllDatasets}
          />
          {modalProps?.isShowTimeSeriesCount && timeSeriesCount ? (
            <h4 className="my-4 text-neutrals-800">
              {titles?.timeSeries ?? 'Timeseries'}: {timeSeriesCount}
            </h4>
          ) : null}
        </div>
        {!isMobile &&
          (isDatasetFacetSelected ? (
            <DatasetValuesPanel
              dataQueries={dataQueries ?? []}
              disabledDatasetUrns={disabledDatasetUrns}
              onToggleDataset={onToggleDataset}
              searchIconSize={modalProps?.filterValuesProps?.searchIconSize}
            />
          ) : (
            <FiltersValuesPanel
              filtersList={displayFilters}
              selectedFilter={displaySelectedFilter}
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
          ))}
      </div>
    </FiltersModalProvider>
  );
};

export default FilterSettings;
