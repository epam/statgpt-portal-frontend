'use client';

import { DataConstraints, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { TimeRange, TimeRangeOptions } from '@epam/statgpt-shared-toolkit';
import { Button, useIsMobile } from '@epam/statgpt-ui-components';
import { FC, ReactNode, useCallback } from 'react';
import {
  Filter,
  FiltersModalProps,
  FilterTreeNodeProps,
} from '../../../../models/filters';
import FiltersFacetsList from './FiltersFacets/FiltersFacetsList';
import FiltersValuesPanel from './FiltersValuesPanel/FiltersValuesPanel';
import classNames from 'classnames';
import { ConversationViewTitles } from '../../../../models/titles';
import {
  getSelectedFilterValues,
  getTotalSelectedValuesLength,
  isSameFilter,
} from '../../../../utils/filters';
import { useConversationViewFeatureToggles } from '../../../../context/ConversationViewFeatureTogglesContext';
import { getInitialConstraints } from '../../../../utils/multiple-filters';

interface Props {
  filtersList: Filter[];
  selectedFilter?: Filter;
  locale?: string;
  isDisableValues?: boolean;
  titles?: ConversationViewTitles;
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
}

const FilterSettings: FC<Props> = ({
  filtersList,
  titles,
  selectedFilter,
  modalProps,
  locale,
  isDisableValues,
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
}) => {
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

    const updatedFilter = {
      ...filterToUpdate,
      dimensionValues: filterToUpdate?.dimensionValues?.map(
        (dimensionValue) => {
          if (dimensionValue?.id === id) {
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

    const updatedFilter = {
      ...filterToUpdate,
      dimensionValues: filterToUpdate?.dimensionValues?.map(
        (dimensionValue) => {
          const nodeValue = nodes?.find(
            (node) => node?.id === dimensionValue?.id,
          );
          return nodeValue || dimensionValue;
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

  const onExpandHierarchicalValue = (
    node?: FilterTreeNodeProps,
    targetFilter?: Filter,
  ) => {
    const filterToUpdate = targetFilter || selectedFilter;
    const shouldUpdateSelectedFilter =
      !targetFilter || isSameFilter(targetFilter, selectedFilter);

    if (!filterToUpdate) {
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
        {isCrossDatasetModeOn && (
          <div className="mb-4 flex items-center justify-between gap-x-4">
            <span className="body-3 text-neutrals-900">
              {titles?.appliedFilters ?? 'Applied filters'}: {allAppliedFilters}
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
          locale={locale}
          titles={titles}
          onSelectFilter={onSelectFilter}
          onSelectDisplayMode={onSelectDisplayMode}
          onDeleteFilter={onDeleteFilter}
          isDisableValues={isDisableValues}
          initialConstraints={initialConstraints}
          initialConstraintsMap={initialConstraintsMap}
          datasetIcon={datasetIcon}
          structuresMap={structuresMap}
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
          filtersList={filtersList}
          selectedFilter={selectedFilter}
          locale={locale}
          titles={titles}
          isDisableValues={isDisableValues}
          timeRangeOptions={timeRangeOptions}
          selectFilterValue={onSelectFilterValue}
          selectHierarchicalNodes={onSelectHierarchicalNodes}
          expandHierarchicalValue={onExpandHierarchicalValue}
          onTimePeriodChange={onSelectTimePeriodValue}
          filterValuesProps={modalProps?.filterValuesProps}
          structuresMap={structuresMap}
          initialConstraints={getInitialConstraints(
            isCrossDatasetModeOn,
            selectedFilter,
            initialConstraints,
            initialConstraintsMap,
          )}
          selectedTimeOption={selectedTimeOption}
        />
      )}
    </div>
  );
};

export default FilterSettings;
