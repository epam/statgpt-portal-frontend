'use client';

import {
  DataConstraints,
  generateShortUrn,
  getTimeSeriesCount,
  TIME_PERIOD,
} from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { Popup, PopUpSize, PopUpState } from '@epam/statgpt-ui-components';
import { Filter, FiltersProps } from '../../../models/filters';
import {
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getSelectedFilterValues,
  getTotalSelectedValuesLength,
  isSameFilter,
  updateFiltersWithDisabledOption,
  updateFiltersWithDisplayMode,
  updateFiltersWithSelectedItem,
} from '../../../utils/filters';
import { getSeriesFilterDto } from '../../../utils/get-series-filters';
import {
  getQueryFilters,
  setDataQueryFilters,
} from '../../../utils/query-filters';
import {
  FC,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { updateMessagesWithSystemMessage } from '../../../utils/system-message';
import { getUpdatedDataQueries } from '../../../utils/get-updated-data-queries';
import {
  buildRequestCacheKey,
  getCachedRequestResult,
} from '../../../utils/request-cache';
import FilterButton from '../Filters/FilterButton/FilterButton';
import FilterSettings from '../Filters/FiltersModal/FiltersSettings';
import ModalFooter from '../Filters/FiltersModal/ModalFooter';
import {
  buildFiltersMap,
  getFilledDatasetFiltersMap,
  getFiltersByConstraints,
  getFiltersPreselectedByDataQueries,
  isStructureDataMapsReady,
} from '../../../utils/multiple-filters';

const MultiDatasetFilters: FC<FiltersProps> = ({
  actions,
  structureDataMaps,
  dimensions,
  buttonProps,
  modalProps,
  attachmentsDataQuery,
  dataQueries,
  initialConstraints,
  onFiltersChange,
  locale,
  timeRangeOptions,
  titles,
  datasetIcon,
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
  const constraintsMapRef = useRef<Map<string, DataConstraints[] | undefined>>(
    structureDataMaps?.constraintsMap,
  );
  const [initialModalConstraints, setInitialModalConstraints] = useState<
    DataConstraints[]
  >([]);
  const [isConstraintsLoading, setIsConstraintsLoading] = useState<boolean>();
  const [isDisableFilterValues, setIsDisableFilterValues] = useState<boolean>();
  const [isModalClosed, setIsModalClosed] = useState(false);

  const isStructureDataReady = useMemo(
    () => isStructureDataMapsReady(dataQueries, structureDataMaps),
    [dataQueries, structureDataMaps],
  );

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
      const filtersMap = buildFiltersMap(filters);
      const requests =
        dataQueries?.map((dataQuery) => {
          const attachmentUrn = dataQuery?.urn ?? '';
          const constraintFilters = getSeriesFilterDto(
            filtersMap?.get(attachmentUrn) || [],
          ).filter((filter) => filter.componentCode !== TIME_PERIOD);
          return actions
            ? getCachedRequestResult(
                actions.getConstraints,
                buildRequestCacheKey(attachmentUrn, constraintFilters),
                () => actions.getConstraints(attachmentUrn, constraintFilters),
              )
            : Promise.resolve(undefined);
        }) || [];

      Promise.all(requests)
        .then((constraintsData) => {
          const currentConstraintsMap = new Map(
            constraintsData?.map((constraintData) => {
              const constraint = constraintData?.data?.dataConstraints;
              return [
                generateShortUrn(
                  constraint?.[0]?.id,
                  constraint?.[0]?.version,
                  constraint?.[0]?.agencyID,
                ),
                constraint,
              ];
            }),
          );
          constraintsMapRef.current = currentConstraintsMap;
          setIsConstraintsLoading?.(false);
          setFilters(
            getFiltersByConstraints(
              filtersMap,
              { ...structureDataMaps, constraintsMap: currentConstraintsMap },
              locale as Locale,
            ),
          );
        })
        .catch(() => {
          const currentConstraintsMap = new Map();
          constraintsMapRef.current = currentConstraintsMap;
          setIsConstraintsLoading?.(false);
          setFilters(
            getFiltersByConstraints(
              filtersMap,
              { ...structureDataMaps, constraintsMap: currentConstraintsMap },
              locale as Locale,
            ),
          );
        })
        .finally(() => {
          setIsDisableFilterValues(false);
        });
    },
    [actions, dataQueries, locale, structureDataMaps],
  );

  useEffect(() => {
    if (!isStructureDataReady) {
      setIsConstraintsLoading(true);
      return;
    }

    const filledDatasetFiltersMap = getFilledDatasetFiltersMap(
      structureDataMaps,
      locale,
    );
    const filtersFromDataQuery = getFiltersPreselectedByDataQueries(
      filledDatasetFiltersMap,
      dataQueries,
      structureDataMaps?.constraintsMap,
    );
    setIsConstraintsLoading?.(true);
    handleFiltersWithConstraints(
      filtersFromDataQuery,
      setAppliedFilters,
      setIsConstraintsLoading,
    );
  }, [
    dataQueries,
    handleFiltersWithConstraints,
    isStructureDataReady,
    locale,
    structureDataMaps,
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
      const dataQueryFilters = setDataQueryFilters(
        filters,
        attachmentsDataQuery?.urn,
      );
      const updatedConversationWithSystemMessage = conversation
        ? {
            ...conversation,
            messages: updateMessagesWithSystemMessage(
              conversation?.messages,
              dataQueryFilters,
              attachmentsDataQuery,
              dataQueries,
            ),
          }
        : null;

      setConversation?.(updatedConversationWithSystemMessage);

      updateDataQueries?.(
        getUpdatedDataQueries(
          dataQueryFilters,
          attachmentsDataQuery,
          dataQueries,
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
    (filters: Filter[]) =>
      getQueryFilters(filters, dimensions, attachmentsDataQuery?.urn),
    [attachmentsDataQuery?.urn, dimensions],
  );

  const updateViewAfterDelete = useCallback(
    (dataConstraints: DataConstraints[], filtersToUpdate: Filter[]) => {
      const currentConstraintsMap = new Map(constraintsMapRef.current);
      currentConstraintsMap.set(
        attachmentsDataQuery?.urn || '',
        dataConstraints,
      );
      constraintsMapRef.current = currentConstraintsMap;
      const filledFilters = getFiltersByConstraints(
        buildFiltersMap(filtersToUpdate),
        { ...structureDataMaps, constraintsMap: currentConstraintsMap },
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
    [attachmentsDataQuery?.urn, locale, structureDataMaps],
  );

  const handleFiltersDelete = useCallback(
    (filtersToUpdate: Filter[]) => {
      setIsDisableFilterValues(true);
      setModalFilters(updateFiltersWithDisabledOption(filtersToUpdate));
      const attachmentUrn = attachmentsDataQuery?.urn ?? '';
      const constraintFilters = getSeriesFilterDto(
        filtersToUpdate,
        attachmentUrn,
      ).filter((filter) => filter.componentCode !== TIME_PERIOD);

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
              datasetIcon={datasetIcon}
              structuresMap={structureDataMaps?.structuresMap}
              timeSeriesCount={`${timeSeriesCount}`}
              setSelectedFilter={setSelectedFilter}
              onSelectDisplayMode={onSelectDisplayMode}
              onDeleteFilter={onDeleteFilter}
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

export default MultiDatasetFilters;
