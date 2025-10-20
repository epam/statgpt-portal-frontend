import {
  DataQuery,
  QueryFilter,
} from '@statgpt/shared-toolkit/src/models/data-query';

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
