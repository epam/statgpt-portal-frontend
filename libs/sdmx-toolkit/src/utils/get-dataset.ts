import { DATASET_DATA_URL } from '../constants/dataset-data-url';
import { splitUrn } from './urn';
import { DatasetQueryFilters } from '../models/dataset-query-filters';

export const generateDatasetDataRequest = (
  urn: string,
  queryParams: string,
  filters: DatasetQueryFilters,
): string => {
  const { filterKey, timeFilter } = filters;
  const { agency, id, version } = splitUrn(urn);
  const params = [encodeURIComponent(timeFilter || ''), queryParams]
    .filter((val) => !!val)
    .join('&');

  const url = `${DATASET_DATA_URL}/${agency}/${id}/${version}`;
  const urlWithParams = `${url}/${filterKey || '*'}?${params}`;

  return urlWithParams;
};
