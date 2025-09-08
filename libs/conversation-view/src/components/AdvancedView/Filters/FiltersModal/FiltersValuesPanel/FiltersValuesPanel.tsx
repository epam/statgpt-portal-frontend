import { FC, useCallback, useEffect, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { InputWithIcon } from '@statgpt/ui-components/src/components/Input/InputWithIcon';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValue,
  FilterValuesProps,
} from '@statgpt/conversation-view/src/models/filters';
import {
  TimeRange,
  TimeRangeOptions,
} from '@statgpt/shared-toolkit/src/models/time-range';
import TimePeriodFacet from './TimePeriodFacet';
import { CalendarResolution } from '@statgpt/shared-toolkit/src/types/calendar';
import FilterValues from './FilterValues';
import { FilterDisplayMode } from '@statgpt/conversation-view/src/constants/filter-display-mode';
import { getFilteredItemsWithParents } from '@statgpt/shared-toolkit/src/utils/get-filtered-items';
import classNames from 'classnames';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

interface Props {
  selectedFilter?: Filter;
  filterValuesProps?: FilterValuesProps;
  locale?: string;
  isDisableValues?: boolean;
  initialTimeRange?: TimeRange;
  timeRangeOptions?: TimeRangeOptions[];
  onTimePeriodChange: (timeRange: TimeRange | null) => void;
  selectFilterValue: (id: string, isSelectedValue?: boolean) => void;
  selectHierarchicalNodes: (nodes?: FilterTreeNodeProps[]) => void;
  expandHierarchicalValue: (value?: FilterTreeNodeProps) => void;
  titles?: ConversationViewTitles;
}

const FiltersValuesPanel: FC<Props> = ({
  selectedFilter,
  filterValuesProps,
  locale,
  isDisableValues,
  initialTimeRange,
  timeRangeOptions,
  onTimePeriodChange,
  selectFilterValue,
  titles,
  selectHierarchicalNodes,
  expandHierarchicalValue,
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
      {selectedFilter?.isTimeDimension && initialTimeRange ? (
        <TimePeriodFacet
          titles={titles}
          initialTimeRange={initialTimeRange}
          calendarResolution={CalendarResolution.DAY}
          timeRange={selectedFilter?.timeRange || null}
          timeRangeOptions={timeRangeOptions || []}
          calendarStartFromMonday={true}
          locale={locale}
          radioIcon={filterValuesProps?.radioIcon}
          onValueChange={onTimePeriodChange}
          calendarIcon={filterValuesProps?.calendarIcon}
          dateFormat={filterValuesProps?.dateFormat}
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
          <div className="flex flex-col mt-3 body-2 overflow-auto flex-1 min-h-0">
            <FilterValues
              filterValues={
                searchQuery ? searchResults : selectedFilter?.dimensionValues
              }
              checkboxIcon={filterValuesProps?.checkboxIcon}
              isHierarchicalView={isHierarchicalView}
              isDisableValues={isDisableValues}
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
