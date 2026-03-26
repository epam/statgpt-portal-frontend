'use client';

import {
  DataConstraints,
  findCodelistByDimension,
  getAvailableCodesFromConstrains,
  getTimeSeriesCount,
  TIME_PERIOD,
} from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { Popup, PopUpSize, PopUpState } from '@epam/statgpt-ui-components';
import FilterSettings from './FiltersModal/FiltersSettings';
import { Filter, FiltersProps } from '../../../models/filters';
import {
  getDatasetFilters,
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getFiltersPreselectedByDataQuery,
  isSameFilter,
  getSelectedFilterValues,
  getTotalSelectedValuesLength,
  updateFiltersWithDisabledOption,
  updateFiltersWithDisplayMode,
  updateFiltersWithSelectedItem,
} from '../../../utils/filters';
import { getFilledFilters } from '../../../utils/get-filled-filters';
import {
  getSeriesFilterDto,
  normalizeConstraintFilters,
} from '../../../utils/get-series-filters';
import {
  getQueryFilters,
  setDataQueryFilters,
} from '../../../utils/query-filters';
import {
  FC,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ModalFooter from './FiltersModal/ModalFooter';
import FilterButton from './FilterButton/FilterButton';
import { updateMessagesWithSystemMessage } from '../../../utils/system-message';
import { getUpdatedDataQueries } from '../../../utils/get-updated-data-queries';
import {
  buildRequestCacheKey,
  getCachedRequestResult,
} from '../../../utils/request-cache';

const Filters: FC<FiltersProps> = ({
  actions,
  dimensions,
  structureDimensions,
  structures,
  buttonProps,
  modalProps,
  attachmentsDataQuery,
  dataQueries,
  initialConstraints,
  onFiltersChange,
  locale,
  timeRangeOptions,
  titles,
  conversationKey,
  conversation,
  setConversation,
  updateConversation,
  updateDataQueries,
  limitMessages,
  filterIconClassName,
}) => {
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [modalFilters, setModalFilters] = useState<Filter[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Filter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter>();
  const [selectedFilterValues, setSelectedFilterValues] = useState<Filter[]>(
    [],
  );
  const [selectedTimeOption, setSelectedTimeOption] = useState<
    string | number | undefined
  >(undefined);
  const constraintsRef = useRef<DataConstraints[]>(initialConstraints || []);
  const [initialModalConstraints, setInitialModalConstraints] = useState<
    DataConstraints[]
  >([]);
  const [isConstraintsLoading, setIsConstraintsLoading] = useState<boolean>();
  const [isDisableFilterValues, setIsDisableFilterValues] = useState<boolean>();
  const isPreselectedFromDataQuery = useRef(false);
  const [isModalClosed, setIsModalClosed] = useState(false);

  const updateSelectedFilterValues = (filter?: Filter) => {
    const filters = filter
      ? modalFilters.map((oldFilter) =>
          isSameFilter(oldFilter, filter) ? filter : oldFilter,
        )
      : modalFilters;

    setIsDisableFilterValues(true);
    setModalFilters(updateFiltersWithDisabledOption(filters));
    setIsConstraintsLoading?.(true);
    handleFiltersWithConstraints(
      filter?.isTimeDimension
        ? updateFiltersWithSelectedItem(filters, filter)
        : filters,
      setModalFilters,
      setIsConstraintsLoading,
    );
  };

  useEffect(() => {
    if (modalState === PopUpState.Closed) {
      setInitialModalConstraints(constraintsRef.current);
    }
  }, [modalState]);

  const handleFiltersWithConstraints = useCallback(
    (
      filters: Filter[],
      setFilters: (filters: Filter[]) => void,
      setIsConstraintsLoading?: (isLoading: boolean) => void,
    ) => {
      const attachmentUrn = attachmentsDataQuery?.urn ?? '';
      const constraintFilters = normalizeConstraintFilters(
        getSeriesFilterDto(filters).filter(
          (filter) => filter.componentCode !== TIME_PERIOD,
        ),
      );
      const request = actions
        ? getCachedRequestResult(
            actions.getConstraints,
            buildRequestCacheKey(attachmentUrn, constraintFilters),
            () => actions.getConstraints(attachmentUrn, constraintFilters),
          )
        : Promise.resolve(undefined);

      request
        .then((constraints) => {
          const newConstraints = constraints?.data?.dataConstraints || [];
          constraintsRef.current = newConstraints;
          setIsConstraintsLoading?.(false);
          setFilters(
            getFilledFilters(
              filters,
              dimensions,
              structures,
              newConstraints,
              locale as Locale,
            ),
          );
        })
        .catch(() => {
          constraintsRef.current = [];
          setIsConstraintsLoading?.(false);
          setFilters(
            getFilledFilters(
              filters,
              dimensions,
              structures,
              [],
              locale as Locale,
            ),
          );
        })
        .finally(() => {
          setIsDisableFilterValues(false);
        });
    },
    [actions, attachmentsDataQuery?.urn, dimensions, locale, structures],
  );

  useEffect(() => {
    const datasetFilters = getDatasetFilters(
      dimensions,
      structures,
      structureDimensions,
      locale,
    );
    const filledDimensions = dimensions?.map((dimension) => {
      const codeList = findCodelistByDimension(
        structures?.codelists,
        structures?.conceptSchemes,
        dimension,
      );
      const availableTerms = getAvailableCodesFromConstrains(
        codeList?.codes,
        dimension.id,
        constraintsRef.current,
        locale,
      );
      return {
        ...dimension,
        dimensionValues: availableTerms,
      };
    });
    const dataFiltersFilled = datasetFilters.map((filter) => {
      const dimensionValues =
        filledDimensions?.find((dim) => dim.id === filter.id)
          ?.dimensionValues || [];
      return {
        ...filter,
        dimensionValues,
      };
    });

    if (!isPreselectedFromDataQuery.current) {
      if (!structures) return;
      const filtersFromDataQuery = getFiltersPreselectedByDataQuery(
        dataFiltersFilled,
        attachmentsDataQuery,
        constraintsRef.current,
      );
      setIsConstraintsLoading?.(true);
      handleFiltersWithConstraints(
        filtersFromDataQuery,
        setAppliedFilters,
        setIsConstraintsLoading,
      );
      isPreselectedFromDataQuery.current = true;
    }
  }, [
    dimensions,
    structureDimensions,
    structures,
    attachmentsDataQuery,
    locale,
    initialConstraints,
    handleFiltersWithConstraints,
  ]);

  useEffect(() => {
    if (appliedFilters?.length) {
      setSelectedFilterValues(getSelectedFilterValues(appliedFilters));
    }
  }, [appliedFilters]);

  useEffect(() => {
    setModalFilters((prevFilters) =>
      updateFiltersWithSelectedItem(prevFilters, selectedFilter),
    );
  }, [selectedFilter]);

  useEffect(() => {
    if (modalState === PopUpState.Opened) {
      setSelectedFilter({ ...appliedFilters?.[0], isSelectedFilter: true });
      setModalFilters(appliedFilters);
    }
    if (modalState === PopUpState.Closed) {
      setSelectedFilter(void 0);
    }
  }, [appliedFilters, modalState]);

  const addSystemMessage = useCallback(
    async (filters: Filter[]) => {
      const dataQueryFilters = setDataQueryFilters(filters);
      const updatedConversationWithSystemMessage = conversation
        ? {
            ...conversation,
            messages: updateMessagesWithSystemMessage(
              conversation?.messages,
              dataQueries,
              void 0,
              dataQueryFilters,
              attachmentsDataQuery,
            ),
          }
        : null;

      setConversation?.(updatedConversationWithSystemMessage);

      updateDataQueries?.(
        getUpdatedDataQueries(
          dataQueries,
          void 0,
          dataQueryFilters,
          attachmentsDataQuery,
        ),
      );

      await updateConversation(decodeURI(conversationKey), {
        name: updatedConversationWithSystemMessage?.name,
        messages: updatedConversationWithSystemMessage?.messages || [],
      });
    },
    [
      attachmentsDataQuery,
      conversation,
      conversationKey,
      dataQueries,
      setConversation,
      updateConversation,
      updateDataQueries,
    ],
  );

  const onSelectDisplayMode = useCallback(
    (filter?: Filter, displayMode?: string) => {
      setModalFilters((prevFilters) =>
        updateFiltersWithDisplayMode(prevFilters, filter, displayMode),
      );
      if (isSameFilter(selectedFilter, filter)) {
        setSelectedFilter((prevFilter) =>
          prevFilter
            ? {
                ...prevFilter,
                displayMode,
              }
            : prevFilter,
        );
      }
    },
    [selectedFilter],
  );

  const getFiltersChangeParams = useCallback(
    (filters: Filter[]) => getQueryFilters(filters, dimensions),
    [dimensions],
  );

  const updateViewAfterDelete = useCallback(
    (dataConstraints: DataConstraints[], filtersToUpdate: Filter[]) => {
      const filledFilters = getFilledFilters(
        filtersToUpdate,
        dimensions,
        structures,
        dataConstraints,
        locale as Locale,
      );
      constraintsRef.current = dataConstraints;

      setSelectedFilter(
        (previousSelectedFilter) =>
          filledFilters?.find((filter) =>
            isSameFilter(filter, previousSelectedFilter),
          ) || previousSelectedFilter,
      );
      setModalFilters(filledFilters);
      setIsDisableFilterValues(false);
    },
    [dimensions, locale, structures],
  );

  const handleFiltersDelete = useCallback(
    (filtersToUpdate: Filter[]) => {
      setIsDisableFilterValues(true);
      setModalFilters(updateFiltersWithDisabledOption(filtersToUpdate));
      const attachmentUrn = attachmentsDataQuery?.urn ?? '';
      const constraintFilters = normalizeConstraintFilters(
        getSeriesFilterDto(filtersToUpdate).filter(
          (filter) => filter.componentCode !== TIME_PERIOD,
        ),
      );

      const request = actions
        ? getCachedRequestResult(
            actions.getConstraints,
            buildRequestCacheKey(attachmentUrn, constraintFilters),
            () => actions.getConstraints(attachmentUrn, constraintFilters),
          )
        : Promise.resolve(undefined);

      request
        .then((constraints) => {
          updateViewAfterDelete(
            constraints?.data?.dataConstraints || [],
            filtersToUpdate,
          );
        })
        .catch(() => {
          updateViewAfterDelete([], filtersToUpdate);
        });
    },
    [actions, attachmentsDataQuery?.urn, updateViewAfterDelete],
  );

  const onDeleteFilter = useCallback(
    (filter?: Filter) => {
      const filtersAfterDelete = getFiltersAfterDelete(modalFilters, filter);

      handleFiltersDelete(filtersAfterDelete);
    },
    [handleFiltersDelete, modalFilters],
  );

  const onCloseModal = useCallback(() => {
    constraintsRef.current = initialModalConstraints;
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);
  }, [initialModalConstraints]);

  const onClearAllFilters = useCallback(() => {
    const filtersAfterClear = getFiltersAfterClear(modalFilters);

    handleFiltersDelete(filtersAfterClear);
  }, [handleFiltersDelete, modalFilters]);

  const onApply = useCallback(() => {
    const params = getFiltersChangeParams(modalFilters);
    onFiltersChange?.(params, constraintsRef.current, modalFilters);

    setAppliedFilters(modalFilters);
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);

    startTransition(() => {
      addSystemMessage(modalFilters);
    });
  }, [
    getFiltersChangeParams,
    modalFilters,
    onFiltersChange,
    addSystemMessage,
    constraintsRef,
  ]);
  const onTimePeriodChange = (value: string | number) => {
    setSelectedTimeOption(value);
  };

  const timeSeriesCount = Number(
    getTimeSeriesCount(constraintsRef?.current?.[0]?.annotations),
  );

  return (
    <div className="filters-container">
      <FilterButton
        buttonProps={buttonProps}
        selectedFiltersCount={getTotalSelectedValuesLength(
          selectedFilterValues,
        )}
        isLoading={isConstraintsLoading}
        setModalState={setModalState}
        titles={titles}
        isModalClosed={isModalClosed}
        warningIcon={limitMessages?.warningIcon}
        filterIconClassName={filterIconClassName}
        timeSeriesCount={timeSeriesCount}
      />
      <>
        {modalState === PopUpState.Opened && (
          <Popup
            heading={titles?.settings || 'Settings'}
            portalId="filters"
            size={PopUpSize.LG}
            containerClassName="advanced-view-filters-modal h-[80%]"
            dividers={modalProps?.isShowDividers}
            onClose={onCloseModal}
            closeButtonTitle={titles?.close || 'Close'}
          >
            <FilterSettings
              locale={locale}
              titles={titles}
              timeRangeOptions={timeRangeOptions}
              filtersList={modalFilters}
              selectedFilter={selectedFilter}
              isDisableValues={isDisableFilterValues}
              modalProps={modalProps}
              initialConstraints={initialConstraints}
              timeSeriesCount={`${timeSeriesCount}`}
              setSelectedFilter={setSelectedFilter}
              onSelectDisplayMode={onSelectDisplayMode}
              onDeleteFilter={onDeleteFilter}
              onClearAllFilters={onClearAllFilters}
              updateSelectedFilterValues={updateSelectedFilterValues}
              onTimePeriodChange={onTimePeriodChange}
              selectedTimeOption={selectedTimeOption}
            />
            <ModalFooter
              titles={titles}
              onApply={onApply}
              onClose={onCloseModal}
              onClearAllFilters={onClearAllFilters}
              modalProps={modalProps}
              applyDisabled={isConstraintsLoading || isDisableFilterValues}
              timeseriesLength={timeSeriesCount}
              limitMessages={limitMessages}
            />
          </Popup>
        )}
      </>
    </div>
  );
};

export default Filters;
