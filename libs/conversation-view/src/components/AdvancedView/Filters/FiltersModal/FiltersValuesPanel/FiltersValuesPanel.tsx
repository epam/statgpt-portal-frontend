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
import { FC, useCallback, useEffect, useState } from 'react';
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

interface Props {
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
  selectFilterValue: (id: string, isSelectedValue?: boolean) => void;
  selectHierarchicalNodes: (nodes?: FilterTreeNodeProps[]) => void;
  expandHierarchicalValue: (value?: FilterTreeNodeProps) => void;
  titles?: ConversationViewTitles;
  selectedTimeOption?: string | number;
}

const FiltersValuesPanel: FC<Props> = ({
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
  const [searchResults, setSearchResults] = useState<FilterValue[]>([]);
  const isHierarchicalView =
    selectedFilter?.displayMode === FilterDisplayMode.HIERARCHY;

  useEffect(() => {
    const filteredValues =
      selectedFilter?.dimensionValues?.filter((item) =>
        item?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()),
      ) || [];

    setSearchResults(
      isHierarchicalView
        ? getFilteredItemsWithParents(
            selectedFilter?.dimensionValues,
            filteredValues,
          )
        : filteredValues,
    );
  }, [isHierarchicalView, searchQuery, selectedFilter?.dimensionValues]);

  useEffect(() => {
    setSearchQuery('');
  }, [selectedFilter]);

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
            <FilterValues
              selectedFilter={selectedFilter}
              filterValues={
                searchQuery ? searchResults : selectedFilter?.dimensionValues
              }
              checkboxIcon={filterValuesProps?.checkboxIcon}
              isHierarchicalView={isHierarchicalView}
              isDisableValues={isDisableValues}
              structuresMap={structuresMap}
              selectFilterValue={selectFilterValue}
              selectHierarchicalNodes={selectHierarchicalNodes}
              expandHierarchicalValue={expandHierarchicalValue}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FiltersValuesPanel;
