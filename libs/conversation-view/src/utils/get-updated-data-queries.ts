import { DataQuery, QueryFilter } from '@epam/statgpt-shared-toolkit';

export const getUpdatedDataQueries = (
  dataQueries?: DataQuery[],
  queryFiltersMap?: Map<string, QueryFilter[]>,
  filters?: QueryFilter[],
  currentDataQuery?: DataQuery,
): DataQuery[] => {
  return (
    dataQueries?.map((dataQuery) => ({
      ...dataQuery,
      filters: queryFiltersMap
        ? queryFiltersMap?.get(dataQuery?.urn) || []
        : filters && currentDataQuery?.urn === dataQuery?.urn
          ? filters
          : dataQuery?.filters,
    })) || []
  );
};
