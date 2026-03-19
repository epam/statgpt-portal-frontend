'use client';

import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import ChevronSolidDownIcon from '../../../../../assets/icons/chevron-solid-down.svg';
import { DataConstraints } from '@epam/statgpt-sdmx-toolkit';
import { TimeRange, TimeRangeOptions } from '@epam/statgpt-shared-toolkit';
import { Dropdown, IconButton } from '@epam/statgpt-ui-components';
import { useIsMobile } from '@epam/statgpt-ui-components';
import {
  Filter,
  FilterTreeNodeProps,
  FilterValuesProps,
} from '../../../../../models/filters';
import ClearIcon from '../../../../../assets/icons/clear.svg';
import SettingsListIcon from '../../../../../assets/icons/settings-list.svg';
import { getDateString } from '../../../../../utils/attachments/time-period';
import {
  getFilterDisplaySettings,
  getSelectedDimensionValues,
} from '../../../../../utils/filters';
import FiltersValuesPanel from '../FiltersValuesPanel/FiltersValuesPanel';
import { ConversationViewTitles } from '../../../../../models/titles';

interface Props {
  filter: Filter;
  locale?: string;
  hideFacetCounterByDefault?: boolean;
  onSelectFilter: (filter?: Filter) => void;
  onSelectDisplayMode?: (filter?: Filter, displayMode?: string) => void;
  onDeleteFilter?: (filter?: Filter) => void;
  filterValuesProps?: FilterValuesProps;
  isDisableValues?: boolean;
  timeRangeOptions?: TimeRangeOptions[];
  titles?: ConversationViewTitles;
  initialConstraints?: DataConstraints[];
  datasetIcon?: ReactNode;
  datasetName?: string;
  onTimePeriodChange: (
    timeRange: TimeRange | null,
    selectedOption: string | number,
  ) => void;
  selectFilterValue: (id: string, isSelectedValue?: boolean) => void;
  selectHierarchicalNodes: (nodes?: FilterTreeNodeProps[]) => void;
  expandHierarchicalValue: (value?: FilterTreeNodeProps) => void;
}

const FiltersFacetItem: FC<Props> = ({
  filter,
  onSelectFilter,
  onSelectDisplayMode,
  onDeleteFilter,
  locale,
  titles,
  initialConstraints,
  datasetIcon,
  datasetName,
  hideFacetCounterByDefault,
  filterValuesProps,
  isDisableValues,
  timeRangeOptions,
  onTimePeriodChange,
  selectFilterValue,
  selectHierarchicalNodes,
  expandHierarchicalValue,
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

  const onSelectFilterDisplayMode = (filterDisplayMode: string) => {
    onSelectDisplayMode?.(filter, filterDisplayMode);
  };

  const showSelectedValuesCounter = hideFacetCounterByDefault
    ? selectedValuesLength > 0
    : true;

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

  return (
    <div className="flex flex-col">
      {datasetName && (
        <h4 className="filters-facet-dataset-name">
          <span className="filters-facet-dataset-icon">{datasetIcon}</span>
          {datasetName}
        </h4>
      )}
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
          className="w-full truncate flex-1 min-w-0 sm:flex sm:items-center"
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

        <div className="ml-2 flex gap-2 items-center text-neutrals-800">
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
            <div className="flex items-center gap-2 filters-facet-item-settings">
              <Dropdown
                triggerButton={
                  <IconButton
                    buttonClassName={classNames(
                      'text-button-tertiary w-4 h-4 border-0 p-0',
                      'filters-facet-item-icon',
                    )}
                    icon={<SettingsListIcon width={16} height={16} />}
                    title={titles?.displayOrder || 'Display Order'}
                    disabled={!filter?.isHierarchical}
                  />
                }
                options={getFilterDisplaySettings(titles)}
                selectedOption={filter?.displayMode}
                disabled={!filter?.isHierarchical}
                onOptionSelect={onSelectFilterDisplayMode}
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
          titles={titles}
          selectedFilter={filter}
          locale={locale}
          isDisableValues={isDisableValues}
          timeRangeOptions={timeRangeOptions}
          selectFilterValue={selectFilterValue}
          selectHierarchicalNodes={selectHierarchicalNodes}
          expandHierarchicalValue={expandHierarchicalValue}
          onTimePeriodChange={onTimePeriodChange}
          filterValuesProps={filterValuesProps}
          initialConstraints={initialConstraints}
        />
      )}
    </div>
  );
};

export default FiltersFacetItem;
