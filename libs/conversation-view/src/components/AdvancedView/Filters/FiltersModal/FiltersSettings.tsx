'use client';

import { DataConstraints } from '@epam/statgpt-sdmx-toolkit';
import { TimeRange, TimeRangeOptions } from '@epam/statgpt-shared-toolkit';
import { useIsMobile } from '@epam/statgpt-ui-components';
import { FC, useCallback } from 'react';
import {
  Filter,
  FiltersModalProps,
  FilterTreeNodeProps,
} from '../../../../models/filters';
import FiltersFacetsList from './FiltersFacets/FiltersFacetsList';
import FiltersValuesPanel from './FiltersValuesPanel/FiltersValuesPanel';
import classNames from 'classnames';
import { useConversationViewTitles } from '../../../../context/ConversationViewTitlesContext';

interface Props {
  filtersList: Filter[];
  selectedFilter?: Filter;
  locale?: string;
  isDisableValues?: boolean;
  timeSeriesCount?: string;
  timeRangeOptions?: TimeRangeOptions[];
  modalProps?: FiltersModalProps;
  initialConstraints?: DataConstraints[];
  setSelectedFilter: (filter?: Filter) => void;
  onSelectDisplayMode: (filterId?: string, displayMode?: string) => void;
  onDeleteFilter?: (filterId?: string) => void;
  updateSelectedFilterValues?: (filter: Filter) => void;
  onTimePeriodChange?: (value: string | number) => void;
  selectedTimeOption?: string | number;
}

const FilterSettings: FC<Props> = ({
  filtersList,
  selectedFilter,
  modalProps,
  locale,
  isDisableValues,
  timeSeriesCount,
  timeRangeOptions,
  initialConstraints,
  setSelectedFilter,
  onSelectDisplayMode,
  onDeleteFilter,
  updateSelectedFilterValues,
  onTimePeriodChange,
  selectedTimeOption,
}) => {
  const titles = useConversationViewTitles();
  const isMobile = useIsMobile();

  const onSelectFilter = useCallback(
    (selectedFilterId?: string) => {
      setSelectedFilter({
        ...filtersList?.find((filter) => filter?.id === selectedFilterId),
        isSelectedFilter: true,
      });
    },
    [filtersList, setSelectedFilter],
  );

  const onSelectFilterValue = (id: string, isSelectedValue?: boolean) => {
    const updatedFilter = {
      ...selectedFilter,
      dimensionValues: selectedFilter?.dimensionValues?.map(
        (dimensionValue) => {
          if (dimensionValue?.id === id) {
            return { ...dimensionValue, isSelectedValue };
          }
          return dimensionValue;
        },
      ),
    };
    setSelectedFilter(updatedFilter);
    if (updateSelectedFilterValues) {
      updateSelectedFilterValues(updatedFilter);
    }
  };

  const onSelectHierarchicalNodes = (nodes?: FilterTreeNodeProps[]) => {
    const updatedFilter = {
      ...selectedFilter,
      dimensionValues: selectedFilter?.dimensionValues?.map(
        (dimensionValue) => {
          const nodeValue = nodes?.find(
            (node) => node?.id === dimensionValue?.id,
          );
          return nodeValue || dimensionValue;
        },
      ),
    };
    setSelectedFilter(updatedFilter);

    if (updateSelectedFilterValues) {
      updateSelectedFilterValues(updatedFilter);
    }
  };

  const onExpandHierarchicalValue = (node?: FilterTreeNodeProps) => {
    setSelectedFilter({
      ...selectedFilter,
      dimensionValues: selectedFilter?.dimensionValues?.map(
        (dimensionValue) => {
          if (dimensionValue?.id === node?.id) {
            return { ...dimensionValue, isExpanded: !node?.isExpanded };
          }
          return dimensionValue;
        },
      ),
    });
  };

  const onSelectTimePeriodValue = (
    timeRange: TimeRange | null,
    selectedOption: string | number,
  ) => {
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
    <div
      className={classNames(
        'flex flex-row gap-5 flex-1 min-h-0 sm:p-0',
        'filters-settings',
      )}
    >
      <div
        className={classNames(
          'h-full sm:w-full',
          modalProps?.isShowTimeSeriesCount && 'flex flex-col justify-between',
        )}
      >
        <FiltersFacetsList
          filtersList={filtersList}
          hideFacetCounterByDefault={modalProps?.isHideFacetCounterByDefault}
          locale={locale}
          onSelectFilter={onSelectFilter}
          onSelectDisplayMode={onSelectDisplayMode}
          onDeleteFilter={onDeleteFilter}
          isDisableValues={isDisableValues}
          initialConstraints={initialConstraints}
          timeRangeOptions={timeRangeOptions}
          selectFilterValue={onSelectFilterValue}
          selectHierarchicalNodes={onSelectHierarchicalNodes}
          expandHierarchicalValue={onExpandHierarchicalValue}
          onTimePeriodChange={onSelectTimePeriodValue}
          filterValuesProps={modalProps?.filterValuesProps}
        />
        {modalProps?.isShowTimeSeriesCount && timeSeriesCount ? (
          <h4 className="text-neutrals-800 my-4">
            {titles?.timeSeries ?? 'Timeseries'}: {timeSeriesCount}
          </h4>
        ) : null}
      </div>
      {!isMobile && (
        <FiltersValuesPanel
          selectedFilter={selectedFilter}
          locale={locale}
          isDisableValues={isDisableValues}
          timeRangeOptions={timeRangeOptions}
          selectFilterValue={onSelectFilterValue}
          selectHierarchicalNodes={onSelectHierarchicalNodes}
          expandHierarchicalValue={onExpandHierarchicalValue}
          onTimePeriodChange={onSelectTimePeriodValue}
          filterValuesProps={modalProps?.filterValuesProps}
          initialConstraints={initialConstraints}
          selectedTimeOption={selectedTimeOption}
        />
      )}
    </div>
  );
};

export default FilterSettings;
