import { DataQuery, QueryFilter } from '@epam/statgpt-shared-toolkit';

export const getUpdatedDataQueries = (
  filters: QueryFilter[],
  currentDataQuery?: DataQuery,
  dataQueries?: DataQuery[],
): DataQuery[] => {
  return (
    dataQueries?.map((dataQuery) => ({
      ...dataQuery,
      filters:
        currentDataQuery?.urn === dataQuery?.urn ? filters : dataQuery?.filters,
    })) || []
  );
};
