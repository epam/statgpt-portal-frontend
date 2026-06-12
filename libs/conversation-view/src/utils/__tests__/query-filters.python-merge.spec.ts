import { buildDataQueryWithMergedFilters } from '../query-filters';
import type { Filter } from '../../models/filters';

// Integration-style: does NOT mock `../multiple-filters`, so the real
// `getFiltersForQueryContext` / `buildFiltersMap` run. This reproduces the
// single-dataset bug where UI filters carry no `datasetUrn` and the URN-keyed
// extraction drops them.

describe('buildDataQueryWithMergedFilters — single-dataset python merge', () => {
  // In single-dataset mode `getDatasetFilters` is called without a datasetUrn,
  // so the resulting filters have `datasetUrn: undefined`.
  const dataQuery = {
    urn: 'IMF.STA:ANEA(6.0.1)',
    filters: [{ componentCode: 'COUNTRY', operator: 'in', values: ['BEL'] }],
  } as any;

  const singleModeUiFilters: Filter[] = [
    {
      id: 'COUNTRY',
      filterType: 'dataset',
      // datasetUrn intentionally omitted — matches single-dataset mode
      dimensionValues: [
        { id: 'BEL', isSelectedValue: true },
        { id: 'USA', isSelectedValue: true },
      ],
    },
  ];

  it('REGRESSION: when scoped to the dataset URN, untagged single-mode filters are dropped', () => {
    const result = buildDataQueryWithMergedFilters(
      dataQuery,
      singleModeUiFilters,
      true,
    );
    const country = result.filters?.find((f) => f.componentCode === 'COUNTRY');
    // Bug shape: UI selection lost; falls back to the original stored value.
    expect(country?.values).toEqual(['BEL']);
  });

  it('without dataset-URN scoping (single-dataset mode) the full UI selection is merged', () => {
    const result = buildDataQueryWithMergedFilters(
      dataQuery,
      singleModeUiFilters,
      false,
    );
    const country = result.filters?.find((f) => f.componentCode === 'COUNTRY');
    expect(country?.values).toEqual(['BEL', 'USA']);
  });
});
