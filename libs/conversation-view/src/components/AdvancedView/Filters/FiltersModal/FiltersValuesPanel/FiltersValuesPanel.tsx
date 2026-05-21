'use client';

import {
  DataConstraints,
  getFilteredItemsWithParents,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { CalendarResolution } from '@epam/statgpt-shared-toolkit';
import { InputWithIcon } from '@epam/statgpt-ui-components';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import {
  Filter,
  FilterValue,
  HierarchyState,
} from '../../../../../models/filters';
import TimePeriodFacet from './TimePeriodFacet';
import FilterValues from './FilterValues';
import { FilterDisplayMode } from '../../../../../constants/filter-display-mode';
import classNames from 'classnames';
import { useConversationViewStyles } from '../../../../../context/ConversationViewStylesContext';
import { useConversationViewFeatureToggles } from '../../../../../context/ConversationViewFeatureTogglesContext';
import { getFilterIdentity, isSameFilter } from '../../../../../utils/filters';
import {
  applySelectionToTree,
  filterHierarchyNodes,
  getSelectedHierarchyNodeIds,
} from '../../../../../utils/hierarchy-view';
import { useFiltersModal } from '../../../../../context/FiltersModalContext';

const MIN_CROSS_DATASET_SEARCH_CHARS = 2;

interface Props {
  filtersList?: Filter[];
  selectedFilter?: Filter;
  initialConstraints?: DataConstraints[];
  structuresMap?: Map<string, StructuralData | undefined>;
  selectedTimeOption?: string | number;
  hierarchyState?: HierarchyState;
}

const FiltersValuesPanel: FC<Props> = ({
  filtersList,
  selectedFilter,
  initialConstraints,
  structuresMap,
  selectedTimeOption,
  hierarchyState,
}) => {
  const { titles } = useConversationViewStyles();
  const {
    locale,
    isDisableValues,
    isValuesLoading,
    timeRangeOptions,
    filterValuesProps,
    dataQueries,
    selectFilterValue,
    selectHierarchicalNodes,
    expandHierarchicalValue,
    onTimePeriodChange,
  } = useFiltersModal();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const isHierarchicalView =
    selectedFilter?.displayMode === FilterDisplayMode.HIERARCHY;
  const selectedFilterIdentity = getFilterIdentity(selectedFilter);
  const isSharedSelectedFilter = selectedFilter?.filterType === 'shared';

  const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
  const hasSearchQuery = isCrossDatasetModeOn
    ? normalizedSearchQuery.length >= MIN_CROSS_DATASET_SEARCH_CHARS
    : !!normalizedSearchQuery;
  const shouldUseGlobalSearch =
    hasSearchQuery && isCrossDatasetModeOn && !isSharedSelectedFilter;
  const showSearchCaption =
    isCrossDatasetModeOn &&
    isInputFocused &&
    normalizedSearchQuery.length < MIN_CROSS_DATASET_SEARCH_CHARS;

  const getFilteredValues = useCallback(
    (filter?: Filter) => {
      if (!filter?.dimensionValues) {
        return { filterValues: [], matchedCount: 0 };
      }

      const matchedValues = filter.dimensionValues.filter((item) =>
        item?.name?.toLowerCase()?.includes(normalizedSearchQuery),
      );

      return {
        filterValues:
          filter.displayMode === FilterDisplayMode.HIERARCHY
            ? getFilteredItemsWithParents(filter.dimensionValues, matchedValues)
            : matchedValues,
        matchedCount: matchedValues.length,
      };
    },
    [normalizedSearchQuery],
  );

  const currentFilterResults = useMemo(
    () =>
      hasSearchQuery
        ? getFilteredValues(selectedFilter).filterValues
        : selectedFilter?.dimensionValues,
    [hasSearchQuery, getFilteredValues, selectedFilter],
  );

  const otherCrossDatasetSections = useMemo(() => {
    if (!shouldUseGlobalSearch) {
      return [];
    }

    return (filtersList || []).reduce<
      {
        filter: Filter;
        filterValues: FilterValue[];
        matchedCount: number;
        isHierarchicalView: boolean;
      }[]
    >((sections, filter) => {
      if (
        isSameFilter(filter, selectedFilter) ||
        filter.filterType === 'shared'
      ) {
        return sections;
      }

      const { filterValues, matchedCount } = getFilteredValues(filter);

      if (!matchedCount) {
        return sections;
      }

      return [
        ...sections,
        {
          filter,
          filterValues,
          matchedCount,
          isHierarchicalView:
            filter.displayMode === FilterDisplayMode.HIERARCHY,
        },
      ];
    }, []);
  }, [shouldUseGlobalSearch, filtersList, selectedFilter, getFilteredValues]);

  const hierarchyTreeNodes = useMemo(() => {
    const nodes = hierarchyState?.treeNodes;
    if (!nodes?.length) return nodes;
    const selectedIds = getSelectedHierarchyNodeIds(selectedFilter);
    const withSelection = selectedIds.size
      ? applySelectionToTree(nodes, selectedIds)
      : nodes;
    return hasSearchQuery
      ? filterHierarchyNodes(withSelection, normalizedSearchQuery)
      : withSelection;
  }, [
    hierarchyState?.treeNodes,
    selectedFilter,
    hasSearchQuery,
    normalizedSearchQuery,
  ]);

  const hasNoCurrentFilterResults = hierarchyTreeNodes
    ? !hierarchyTreeNodes.length
    : !currentFilterResults?.length;
  const isCurrentFilterLoading =
    Boolean(isValuesLoading) || Boolean(hierarchyState?.isLoading);

  const otherResultsCount = useMemo(
    () =>
      otherCrossDatasetSections.reduce(
        (total, section) => total + section.matchedCount,
        0,
      ),
    [otherCrossDatasetSections],
  );

  useEffect(() => {
    setSearchQuery('');
    setIsInputFocused(false);
  }, [selectedFilterIdentity]);

  const onSearchQueryChange = useCallback(
    (search: string) => {
      setSearchQuery(search);
    },
    [setSearchQuery],
  );

  return (
    <>
      {selectedFilter?.isTimeDimension && initialConstraints ? (
        <TimePeriodFacet
          initialConstraints={initialConstraints}
          calendarResolution={CalendarResolution.DAY}
          timeRange={selectedFilter?.timeRange || null}
          timeRangeOptions={timeRangeOptions || []}
          calendarStartFromMonday={true}
          locale={locale}
          radioIcon={filterValuesProps?.radioIcon}
          onValueChange={onTimePeriodChange}
          calendarIcon={filterValuesProps?.calendarIcon}
          dateFormat={filterValuesProps?.dateFormat}
          defaultTimeOption={selectedTimeOption}
          dataQueries={dataQueries}
        />
      ) : (
        <div
          className={classNames(
            'flex flex-col pt-2 pb-2 h-full flex-1 min-w-0 sm:border-0',
            'filter-values-container',
          )}
        >
          <InputWithIcon
            inputId="filters-search-input"
            containerClasses={'gap-2 items-center filters-search-input'}
            cssClass="filters-search-input-text"
            placeholder={titles?.searchPlaceholder ?? 'Search'}
            value={searchQuery}
            onChange={onSearchQueryChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            iconBeforeInput={
              <IconSearch
                width={filterValuesProps?.searchIconSize}
                height={filterValuesProps?.searchIconSize}
                className="text-primary"
              />
            }
          />
          {isCrossDatasetModeOn && (
            <span
              className={classNames('caption text-neutrals-800 mt-1', {
                invisible: !showSearchCaption,
              })}
            >
              {titles?.searchMinCharsCaption ??
                'Enter at least 2 characters to start searching'}
            </span>
          )}
          <div className="body-2 mt-3 flex min-h-0 flex-1 flex-col overflow-auto">
            {shouldUseGlobalSearch ? (
              <>
                {selectedFilter && (
                  <div className="shrink-0 pb-4">
                    <FilterValues
                      selectedFilter={selectedFilter}
                      filterValues={currentFilterResults}
                      checkboxIcon={filterValuesProps?.checkboxIcon}
                      isHierarchicalView={isHierarchicalView}
                      isVirtualized={false}
                      isScrollable={false}
                      isDisableValues={isDisableValues}
                      isValuesLoading={isValuesLoading}
                      structuresMap={structuresMap}
                      hierarchyTreeNodes={hierarchyTreeNodes}
                      isHierarchyLoading={hierarchyState?.isLoading}
                      selectFilterValue={selectFilterValue}
                      selectHierarchicalNodes={selectHierarchicalNodes}
                      expandHierarchicalValue={expandHierarchicalValue}
                    />
                    {!isCurrentFilterLoading && hasNoCurrentFilterResults && (
                      <span className="body-2 text-neutrals-700">
                        {titles?.noResultsInSection?.(
                          selectedFilter.title ?? '',
                        ) ??
                          `No results found in ${selectedFilter.title ?? ''}`}
                      </span>
                    )}
                  </div>
                )}
                <div className="pb-3">
                  <span className="h2 text-neutrals-1000">
                    {titles?.otherResults ?? 'Other results'}:{' '}
                    {otherResultsCount}
                  </span>
                  {!isValuesLoading && otherResultsCount === 0 && (
                    <p className="body-2 mt-1 text-neutrals-700">
                      {titles?.noResultsInOtherDimensions ??
                        'No results found in other dimensions'}
                    </p>
                  )}
                </div>
                {otherCrossDatasetSections.map(
                  ({
                    filter,
                    filterValues,
                    isHierarchicalView: isSectionTree,
                  }) => (
                    <div
                      className="shrink-0 pb-4 last:pb-0"
                      key={getFilterIdentity(filter)}
                    >
                      <FilterValues
                        selectedFilter={filter}
                        filterValues={filterValues}
                        checkboxIcon={filterValuesProps?.checkboxIcon}
                        isHierarchicalView={isSectionTree}
                        isVirtualized={false}
                        isScrollable={false}
                        isDisableValues={isDisableValues}
                        isValuesLoading={isValuesLoading}
                        structuresMap={structuresMap}
                        selectFilterValue={(id, isSelectedValue) =>
                          selectFilterValue(id, isSelectedValue, filter)
                        }
                        selectHierarchicalNodes={(nodes) =>
                          selectHierarchicalNodes(nodes, filter)
                        }
                        expandHierarchicalValue={(value) =>
                          expandHierarchicalValue(value, filter)
                        }
                      />
                    </div>
                  ),
                )}
              </>
            ) : (
              <FilterValues
                selectedFilter={selectedFilter}
                filterValues={currentFilterResults}
                checkboxIcon={filterValuesProps?.checkboxIcon}
                isHierarchicalView={isHierarchicalView}
                isDisableValues={isDisableValues}
                isValuesLoading={isValuesLoading}
                structuresMap={structuresMap}
                hierarchyTreeNodes={hierarchyTreeNodes}
                isHierarchyLoading={hierarchyState?.isLoading}
                selectFilterValue={selectFilterValue}
                selectHierarchicalNodes={selectHierarchicalNodes}
                expandHierarchicalValue={expandHierarchicalValue}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FiltersValuesPanel;
