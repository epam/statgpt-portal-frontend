'use client';

import { TimeRange } from '@epam/statgpt-shared-toolkit';
import { Button, useIsMobile } from '@epam/statgpt-ui-components';
import { FC, useCallback, useMemo, useState } from 'react';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValue,
} from '../../../../models/filters';
import FiltersFacetsList from './FiltersFacets/FiltersFacetsList';
import FiltersValuesPanel from './FiltersValuesPanel/FiltersValuesPanel';
import { DatasetValuesPanel } from './FiltersValuesPanel/DatasetValuesPanel';
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
import {
  filterSharedValuesForEnabledDatasets,
  getInitialConstraints,
} from '../../../../utils/multiple-filters';
import { FiltersModalProvider } from '../../../../context/FiltersModalContext';
import {
  mapHierarchyNodeIdToFilterValueId,
  mapHierarchyNodesToFilterValueIds,
} from '../../../../utils/hierarchy-view';
import { type FilterSettingsController } from './filter-settings-controller';

interface Props {
  controller: FilterSettingsController;
}

const FilterSettings: FC<Props> = ({ controller }) => {
  const {
    state: {
      filtersList,
      selectedFilter,
      isDisableValues,
      isValuesLoading,
      timeSeriesCount,
      selectedTimeOption,
      disabledDatasetUrns,
    },
    options: {
      modalProps,
      locale,
      timeRangeOptions,
      initialConstraints,
      initialConstraintsMap,
      datasetIcon,
      structuresMap,
      dataQueries,
    },
    handlers: {
      setSelectedFilter,
      onSelectDisplayMode,
      onDeleteFilter,
      onClearAllFilters,
      updateSelectedFilterValues,
      onTimePeriodChange,
      onToggleDataset,
      onClearAllDatasets,
    },
    hierarchy: { hierarchyStateMap, onSelectHierarchy, onExpandHierarchyNode },
  } = controller;
  const { titles } = useConversationViewStyles();
  const hierarchyState = hierarchyStateMap?.get(
    getFilterIdentity(selectedFilter) as string,
  );
  const isMobile = useIsMobile();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const [isDatasetFacetSelected, setIsDatasetFacetSelected] = useState(false);
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
