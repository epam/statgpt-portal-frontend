import {
  DatasetQueryFilters,
  Dimension,
  DimensionList,
  GET_v3_FILTER_ALL,
  getQueryTimePeriodFilters,
  getTimeRangeFromAttachment,
  getTimeSeriesFilterKey,
} from '@epam/statgpt-sdmx-toolkit';
import {
  DataQuery,
  QueryFilter,
  QueryFilterType,
} from '@epam/statgpt-shared-toolkit';
import { Filter } from '../models/filters';
import { getSelectedFilterValues } from './filters';
import { getFiltersForQueryContext } from './multiple-filters';

export const getQueryTimeSeriesFilters = (filters: Filter[]): QueryFilter[] =>
  filters.map(
    (filter): QueryFilter => ({
      componentCode: filter.id || '',
      operator: QueryFilterType.IN,
      values: filter.dimensionValues?.map((v) => v.id) || [],
    }),
  );

export const getTimeQueryFilterFromAttachment = (
  dataQuery: DataQuery,
  dimensions?: DimensionList,
): string | null => {
  const timeDimension = dimensions?.timeDimensions?.[0];
  const timeRange =
    getTimeRangeFromAttachment(dataQuery, timeDimension as Dimension) || null;
  const timeFilter = timeRange
    ? (getQueryTimePeriodFilters(timeRange, timeDimension?.id) as string)
    : null;
  return timeFilter;
};

export const getQueryFilters = (
  filters: Filter[],
  dimensions?: Dimension[],
  datasetUrn?: string,
): DatasetQueryFilters => {
  const selectedFilterValues = getSelectedFilterValues(
    getFiltersForQueryContext(filters, datasetUrn),
  );
  const timePeriodFilter = selectedFilterValues.find(
    (filter) => filter?.isTimeDimension && filter?.timeRange,
  );
  return {
    filterKey: getTimeSeriesFilterKey(
      dimensions || [],
      getQueryTimeSeriesFilters(selectedFilterValues),
    ),
    timeFilter: getQueryTimePeriodFilters(
      timePeriodFilter?.timeRange,
      timePeriodFilter?.id,
    ),
  };
};

const formatDate = (date?: Date): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};

const formatDateIso = (date?: Date): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

const buildQueryFiltersCore = (
  filters: Filter[],
  datasetUrn?: string,
  formatTimePeriod: (date?: Date) => string = formatDate,
): QueryFilter[] => {
  return getFiltersForQueryContext(filters, datasetUrn)
    ?.filter(
      (filter) =>
        filter.timeRange ||
        filter.isExcluded ||
        filter.dimensionValues?.some((value) => value.isSelectedValue),
    )
    .map((filter) => {
      if (filter?.isTimeDimension) {
        return {
          componentCode: filter?.id as string,
          operator: QueryFilterType.BETWEEN,
          values: [
            formatTimePeriod(filter?.timeRange?.startPeriod || undefined) || '',
            formatTimePeriod(filter?.timeRange?.endPeriod || undefined) || '',
          ],
        };
      }

      if (filter.isExcluded) {
        return {
          componentCode: filter?.id as string,
          operator: QueryFilterType.EXCLUDED,
          values: [],
        };
      }

      return {
        componentCode: filter?.id as string,
        operator: QueryFilterType.IN,
        values:
          filter?.dimensionValues
            ?.filter((value) => value.isSelectedValue)
            ?.map((value) => value.id) || [],
      };
    });
};

const getUiControlledFilterCodes = (
  filters: Filter[],
  datasetUrn: string,
): Set<string> => {
  const expandedFilterCodes = getFiltersForQueryContext(
    filters,
    datasetUrn,
  ).flatMap((filter) => (filter.id ? [filter.id] : []));
  const sharedSourceFilterCodes = filters.flatMap((filter) => {
    if (filter.filterType !== 'shared') {
      return [];
    }

    const sourceFilterId = filter.sourceFilterIdsByDataset?.[datasetUrn];
    return sourceFilterId ? [sourceFilterId] : [];
  });

  return new Set([...expandedFilterCodes, ...sharedSourceFilterCodes]);
};

const getWildcardFiltersForClearedUiCodes = (
  uiFilterCodes: Set<string>,
  updatedFiltersFromUI: QueryFilter[],
): QueryFilter[] => {
  const updatedFilterCodes = new Set(
    updatedFiltersFromUI.map((filter) => filter.componentCode),
  );

  return Array.from(uiFilterCodes)
    .filter((componentCode) => !updatedFilterCodes.has(componentCode))
    .map((componentCode) => ({
      componentCode,
      operator: QueryFilterType.IN,
      values: [GET_v3_FILTER_ALL],
    }));
};

export const buildDataQueryWithMergedFilters = (
  dataQuery: DataQuery,
  uiFilters: Filter[],
): DataQuery => {
  const updatedFiltersFromUI = buildQueryFiltersForPythonAttachment(
    uiFilters,
    dataQuery.urn,
  );
  const uiFilterCodes = getUiControlledFilterCodes(uiFilters, dataQuery.urn);
  const wildcardFiltersFromUI = getWildcardFiltersForClearedUiCodes(
    uiFilterCodes,
    updatedFiltersFromUI,
  );
  const hiddenFilters = (dataQuery.filters ?? []).filter(
    (f) => !uiFilterCodes.has(f.componentCode),
  );
  return {
    ...dataQuery,
    filters: [
      ...hiddenFilters,
      ...updatedFiltersFromUI,
      ...wildcardFiltersFromUI,
    ],
  };
};

export const setDataQueryFilters = (
  filters: Filter[],
  datasetUrn?: string,
): QueryFilter[] => buildQueryFiltersCore(filters, datasetUrn);

export const buildQueryFiltersForPythonAttachment = (
  filters: Filter[],
  datasetUrn?: string,
): QueryFilter[] => buildQueryFiltersCore(filters, datasetUrn, formatDateIso);
