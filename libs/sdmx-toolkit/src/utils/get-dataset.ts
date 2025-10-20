import { DATASET_DATA_URL } from '../constants/dataset-data-url';
import { splitUrn } from './urn';
import { DatasetQueryFilters } from '../models/dataset-query-filters';
import { AND_QUERY_OPERATOR } from '../constants/query-parameters';
import { GET_v3_FILTER_ALL } from '../constants/filter-operators';

export const generateDatasetDataRequest = (
  urn: string,
  queryParams: string,
  filters: DatasetQueryFilters,
): string => {
  const { filterKey, timeFilter } = filters;
  const { agency, id, version } = splitUrn(urn);
  const params = [timeFilter || '', queryParams]
    .filter((val) => !!val)
    .join(AND_QUERY_OPERATOR);

  const url = `${DATASET_DATA_URL}/${agency}/${id}/${version}`;

  return `${url}/${filterKey || GET_v3_FILTER_ALL}?${params}`;
};
