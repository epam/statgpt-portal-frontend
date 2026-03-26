'use client';

import {
  DataConstraints,
  getFilteredItemsWithParents,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import {
  CalendarResolution,
  TimeRange,
  TimeRangeOptions,
} from '@epam/statgpt-shared-toolkit';
import { InputWithIcon } from '@epam/statgpt-ui-components';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValue,
  FilterValuesProps,
} from '../../../../../models/filters';
import TimePeriodFacet from './TimePeriodFacet';
import FilterValues from './FilterValues';
import { FilterDisplayMode } from '../../../../../constants/filter-display-mode';
import classNames from 'classnames';
import { ConversationViewTitles } from '../../../../../models/titles';
import { useConversationViewFeatureToggles } from '../../../../../context/ConversationViewFeatureTogglesContext';
import { getFilterIdentity, isSameFilter } from '../../../../../utils/filters';

interface Props {
  filtersList?: Filter[];
  selectedFilter?: Filter;
  filterValuesProps?: FilterValuesProps;
  locale?: string;
  isDisableValues?: boolean;
  timeRangeOptions?: TimeRangeOptions[];
  initialConstraints?: DataConstraints[];
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
  titles?: ConversationViewTitles;
  selectedTimeOption?: string | number;
}

const FiltersValuesPanel: FC<Props> = ({
  filtersList,
  selectedFilter,
  filterValuesProps,
  locale,
  isDisableValues,
  timeRangeOptions,
  onTimePeriodChange,
  selectFilterValue,
  titles,
  initialConstraints,
  structuresMap,
  selectHierarchicalNodes,
  expandHierarchicalValue,
  selectedTimeOption,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const isHierarchicalView =
    selectedFilter?.displayMode === FilterDisplayMode.HIERARCHY;
  const selectedFilterIdentity = getFilterIdentity(selectedFilter);
  const isSharedSelectedFilter = selectedFilter?.filterType === 'shared';

  const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
  const hasSearchQuery = !!normalizedSearchQuery;
  const shouldUseGlobalSearch =
    hasSearchQuery && isCrossDatasetModeOn && !isSharedSelectedFilter;

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
          titles={titles}
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
            iconBeforeInput={
              <IconSearch
                width={filterValuesProps?.searchIconSize}
                height={filterValuesProps?.searchIconSize}
                className="text-primary"
              />
            }
          />
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
                      structuresMap={structuresMap}
                      selectFilterValue={selectFilterValue}
                      selectHierarchicalNodes={selectHierarchicalNodes}
                      expandHierarchicalValue={expandHierarchicalValue}
                    />
                  </div>
                )}
                {otherResultsCount > 0 && (
                  <div className="pb-3">
                    <span className="h2 text-neutrals-1000">
                      {titles?.otherResults ?? 'Other results'}:{' '}
                      {otherResultsCount}
                    </span>
                  </div>
                )}
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
                structuresMap={structuresMap}
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
