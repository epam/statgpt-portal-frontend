import { SeriesFilterDto } from '@epam/statgpt-sdmx-toolkit';

export const normalizeConstraintFilters = (
  filters: SeriesFilterDto[],
): SeriesFilterDto[] =>
  [...filters]
    .map((filter) => ({
      ...filter,
      value: filter.value.split(',').sort().join(','),
    }))
    .sort((a, b) => a.componentCode.localeCompare(b.componentCode));
