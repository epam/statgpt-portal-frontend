'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import ChevronSolidDownIcon from '../../../../../assets/icons/chevron-solid-down.svg';
import { DataConstraints, Hierarchy } from '@epam/statgpt-sdmx-toolkit';
import { TimeRange, TimeRangeOptions } from '@epam/statgpt-shared-toolkit';
import { Dropdown, IconButton, useIsMobile } from '@epam/statgpt-ui-components';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValuesProps,
  HierarchyState,
} from '../../../../../models/filters';
import ClearIcon from '../../../../../assets/icons/clear.svg';
import SettingsListIcon from '../../../../../assets/icons/settings-list.svg';
import { getDateString } from '../../../../../utils/attachments/time-period';
import {
  getHierarchyOptions,
  getSelectedDimensionValues,
} from '../../../../../utils/filters';
import { FilterDisplayMode } from '../../../../../constants/filter-display-mode';
import FiltersValuesPanel from '../FiltersValuesPanel/FiltersValuesPanel';
import { ConversationViewTitles } from '../../../../../models/titles';

interface Props {
  filtersList?: Filter[];
  filter: Filter;
  locale?: string;
  hideFacetCounterByDefault?: boolean;
  onSelectFilter: (filter?: Filter) => void;
  onSelectDisplayMode?: (filter?: Filter, displayMode?: string) => void;
  onDeleteFilter?: (filter?: Filter) => void;
  filterValuesProps?: FilterValuesProps;
  isDisableValues?: boolean;
  isValuesLoading?: boolean;
  timeRangeOptions?: TimeRangeOptions[];
  titles?: ConversationViewTitles;
  initialConstraints?: DataConstraints[];
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
  hierarchyState?: HierarchyState;
  onSelectHierarchy?: (filter?: Filter, hierarchy?: Hierarchy | null) => void;
}

const FiltersFacetItem: FC<Props> = ({
  filtersList,
  filter,
  onSelectFilter,
  onSelectDisplayMode,
  onDeleteFilter,
  locale,
  titles,
  initialConstraints,
  hideFacetCounterByDefault,
  filterValuesProps,
  isDisableValues,
  isValuesLoading,
  timeRangeOptions,
  onTimePeriodChange,
  selectFilterValue,
  selectHierarchicalNodes,
  expandHierarchicalValue,
  hierarchyState,
  onSelectHierarchy,
}) => {
  const isMobile = useIsMobile();

  const [selectedValuesLength, setSelectedValuesLength] = useState<number>(0);
  const [isSelected, setIsSelected] = useState(false);
  const isTimeDimension = filter?.isTimeDimension && filter?.timeRange;
  const timePeriodValue = useMemo(() => {
    return filter?.timeRange?.startPeriod && filter?.timeRange?.endPeriod
      ? `${getDateString(filter?.timeRange?.startPeriod, locale)} -
              ${getDateString(filter?.timeRange?.endPeriod, locale)}`
      : '';
  }, [locale, filter?.timeRange]);

  useEffect(() => {
    setSelectedValuesLength(
      getSelectedDimensionValues(filter?.dimensionValues)?.length,
    );
  }, [filter?.dimensionValues]);

  const showSelectedValuesCounter = hideFacetCounterByDefault
    ? selectedValuesLength > 0
    : true;

  const hierarchyOptions = useMemo(
    () =>
      getHierarchyOptions({
        isHierarchical: filter?.isHierarchical,
        availableHierarchies: hierarchyState?.availableHierarchies,
        titles,
      }),
    [filter?.isHierarchical, hierarchyState?.availableHierarchies, titles],
  );

  const isHierarchyDropdownDisabled =
    hierarchyState?.isLoading ||
    (!filter?.isHierarchical && !hierarchyState?.availableHierarchies?.length);

  useEffect(() => {
    if (!filter.isSelectedFilter) {
      setIsSelected(false);
    }
  }, [filter.isSelectedFilter]);

  const onFilterClick = () => {
    if (isMobile) {
      setIsSelected((prev) => !prev);
    }
    onSelectFilter(filter);
  };

  const onOptionSelect = (key: string) => {
    if (key === '') {
      onSelectHierarchy?.(filter, null);
      onSelectDisplayMode?.(filter, FilterDisplayMode.FLAT_LIST);
    } else if (key === FilterDisplayMode.HIERARCHY) {
      onSelectHierarchy?.(filter, null);
      onSelectDisplayMode?.(filter, FilterDisplayMode.HIERARCHY);
    } else {
      const selected =
        hierarchyState?.availableHierarchies?.find((h) => h.id === key) ?? null;
      onSelectHierarchy?.(filter, selected);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        className={classNames(
          'flex justify-between items-center p-2 hover:bg-hues-100 py-2 sm:py-4 sm:hover:bg-white',
          'filters-facet-item cursor-pointer',
          filter?.isSelectedFilter && !isMobile && 'bg-hues-100',
          filter?.isDisabled &&
            'cursor-default pointer-events-none opacity-[0.7]',
        )}
        onClick={onFilterClick}
      >
        <h3
          className="w-full min-w-0 flex-1 truncate sm:flex sm:items-center"
          title={filter?.title}
        >
          <span className="truncate">{filter?.title}</span>
          {isMobile && (
            <ChevronSolidDownIcon
              className={classNames(
                'chevron-icon w-6 h-6 shrink-0',
                isSelected && 'rotate-180',
              )}
            />
          )}
        </h3>

        <div className="ml-2 flex items-center gap-2 text-neutrals-800">
          {isTimeDimension && (
            <span className="filters-facet-item-counter border-none">
              {timePeriodValue}
            </span>
          )}

          {!isTimeDimension && showSelectedValuesCounter && (
            <span
              className={classNames(
                'px-2 text-center',
                'filters-facet-item-counter',
              )}
            >
              {selectedValuesLength
                ? `${selectedValuesLength}/${filter?.dimensionValues?.length || 0}`
                : titles?.all || 'All'}
            </span>
          )}

          {isTimeDimension ? null : (
            <div className="filters-facet-item-settings flex items-center gap-2">
              <Dropdown
                triggerButton={
                  <IconButton
                    buttonClassName={classNames(
                      'text-button-tertiary w-4 h-4 border-0 p-0',
                      'filters-facet-item-icon',
                    )}
                    icon={<SettingsListIcon width={16} height={16} />}
                    title={titles?.displayOrder || 'Display Order'}
                    disabled={isHierarchyDropdownDisabled}
                  />
                }
                disabled={isHierarchyDropdownDisabled}
                options={hierarchyOptions}
                selectedOption={
                  hierarchyState?.selectedHierarchy?.id ??
                  (filter?.displayMode === FilterDisplayMode.HIERARCHY
                    ? FilterDisplayMode.HIERARCHY
                    : '')
                }
                onOptionSelect={onOptionSelect}
              />
              {selectedValuesLength > 0 && (
                <IconButton
                  buttonClassName={classNames(
                    'text-button-tertiary w-4 h-4 border-0 p-0',
                    'filters-facet-item-icon',
                  )}
                  icon={<ClearIcon width={16} height={16} />}
                  title={titles?.reset || 'Reset'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFilter?.(filter);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
      {isSelected && (
        <FiltersValuesPanel
          filtersList={filtersList}
          titles={titles}
          selectedFilter={filter}
          locale={locale}
          isDisableValues={isDisableValues}
          isValuesLoading={isValuesLoading}
          timeRangeOptions={timeRangeOptions}
          selectFilterValue={selectFilterValue}
          selectHierarchicalNodes={selectHierarchicalNodes}
          expandHierarchicalValue={expandHierarchicalValue}
          onTimePeriodChange={onTimePeriodChange}
          filterValuesProps={filterValuesProps}
          initialConstraints={initialConstraints}
          hierarchyState={hierarchyState}
        />
      )}
    </div>
  );
};

export default FiltersFacetItem;
