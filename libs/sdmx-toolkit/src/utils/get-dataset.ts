import { DATASET_DATA_URL } from '@statgpt/sdmx-toolkit/src/constants/dataset-data-url';
import { splitUrn } from '@statgpt/sdmx-toolkit/src/utils/urn';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';

export const generateDatasetDataRequest = (
  urn: string,
  queryParams: string,
  filters: DatasetQueryFilters,
): string => {
  const { filterKey, timeFilter } = filters;
  const { agency, id, version } = splitUrn(urn);
  const params = [timeFilter, queryParams].filter((val) => !!val).join('&');

  const url = `${DATASET_DATA_URL}/${agency}/${id}/${version}`;
  const urlWithParams = `${url}/${filterKey || '*'}?${params}`;

  return urlWithParams;
};
