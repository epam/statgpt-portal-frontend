import {
  clearFilterValues,
  getDatasetFilters,
  getHierarchyOptions,
  getFilterIdentity,
  getFilterNodesBySelection,
  getFilterTreeNodePadding,
  getFilterValuesTree,
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getFiltersPreselectedByDataQuery,
  getNewHierarchyFilterValues,
  getSelectedDimensionValues,
  getSelectedFilterValues,
  getTotalSelectedValuesLength,
  hasSelectedDescendant,
  isSameFilter,
  isSharedFilter,
  updateFiltersWithDisabledOption,
  updateFiltersWithDisplayMode,
  updateFiltersWithSelectedItem,
} from '../filters';
import type { Filter, FilterTreeNodeProps } from '../../models/filters';
import { FilterDisplayMode } from '../../constants/filter-display-mode';

// ─── Mock functions ───────────────────────────────────────────────────────────

const mockFindCodelistByDimension = jest.fn(() => null as any);
const mockGetAvailableCodes = jest.fn(() => [] as any[]);
const mockGetDimensionTitle = jest.fn(() => 'Title');
const mockGetAnnotationPeriod = jest.fn(() => ({
  startPeriod: null,
  endPeriod: null,
}));
const mockGetTimePeriod = jest.fn(() => null as Date | null);
const mockGetMergedTimeRange = jest.fn((range: any) => range);

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  DimensionType: {
    DIMENSION: 'Dimension',
    TIME_DIMENSION: 'TimeDimension',
    MEASURE_DIMENSION: 'MeasureDimension',
  },
  findCodelistByDimension: (...args: any[]) =>
    (mockFindCodelistByDimension as any)(...args),
  getAvailableCodes: (...args: any[]) =>
    (mockGetAvailableCodes as any)(...args),
  getDimensionTitle: (...args: any[]) =>
    (mockGetDimensionTitle as any)(...args),
  getAnnotationPeriod: (...args: any[]) =>
    (mockGetAnnotationPeriod as any)(...args),
}));

jest.mock('@epam/statgpt-shared-toolkit', () => ({
  getTimePeriod: (...args: any[]) => (mockGetTimePeriod as any)(...args),
}));

jest.mock('@epam/statgpt-ui-components', () => ({
  TREE_NODE_PADDING: 24,
  TREE_NODE_ARROW_SIZE: 24,
}));

jest.mock('../attachments/time-period', () => ({
  getMergedTimeRange: (...args: any[]) =>
    (mockGetMergedTimeRange as any)(...args),
}));

// ─── Default mock reset ───────────────────────────────────────────────────────

beforeEach(() => {
  mockFindCodelistByDimension.mockReturnValue(null);
  mockGetAvailableCodes.mockReturnValue([]);
  mockGetDimensionTitle.mockReturnValue('Title');
  mockGetAnnotationPeriod.mockReturnValue({
    startPeriod: null,
    endPeriod: null,
  });
  mockGetTimePeriod.mockReturnValue(null);
  mockGetMergedTimeRange.mockImplementation((range: any) => range);
});

// ─── Test data helpers ────────────────────────────────────────────────────────

const makeDatasetFilter = (
  id: string,
  datasetUrn = 'AGENCY:DF(1.0)',
  values: Array<{ id: string; isSelectedValue?: boolean }> = [],
): Filter => ({
  id,
  filterType: 'dataset',
  datasetUrn,
  dimensionValues: values.map((v) => ({
    id: v.id,
    isSelectedValue: v.isSelectedValue ?? false,
  })),
});

const makeSharedFilter = (
  id: string,
  values: Array<{ id: string }> = [],
): Filter => ({
  id,
  filterType: 'shared',
  dimensionValues: values.map((v) => ({ id: v.id })),
});

// ─── isSharedFilter ───────────────────────────────────────────────────────────

describe('isSharedFilter', () => {
  it('returns true for a shared filter', () => {
    expect(isSharedFilter(makeSharedFilter('COUNTRY'))).toBe(true);
  });

  it('returns false for a dataset filter', () => {
    expect(isSharedFilter(makeDatasetFilter('COUNTRY'))).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isSharedFilter(undefined)).toBe(false);
  });
});

// ─── getFilterIdentity ────────────────────────────────────────────────────────

describe('getFilterIdentity', () => {
  it('returns undefined when filter has no id', () => {
    expect(getFilterIdentity({ filterType: 'dataset' })).toBeUndefined();
  });

  it('returns "shared:<id>" for a shared filter', () => {
    expect(getFilterIdentity(makeSharedFilter('COUNTRY'))).toBe(
      'shared:COUNTRY',
    );
  });

  it('returns "<datasetUrn>:<id>" for a dataset filter with a URN', () => {
    expect(getFilterIdentity(makeDatasetFilter('FREQ', 'AGENCY:DF(1.0)'))).toBe(
      'AGENCY:DF(1.0):FREQ',
    );
  });

  it('returns "<id>" for a dataset filter without a URN', () => {
    const filter: Filter = { id: 'FREQ', filterType: 'dataset' };
    expect(getFilterIdentity(filter)).toBe('FREQ');
  });
});

// ─── isSameFilter ─────────────────────────────────────────────────────────────

describe('isSameFilter', () => {
  it('returns true when both filters have the same dataset URN and id', () => {
    const a = makeDatasetFilter('FREQ', 'AGENCY:DF(1.0)');
    const b = makeDatasetFilter('FREQ', 'AGENCY:DF(1.0)');
    expect(isSameFilter(a, b)).toBe(true);
  });

  it('returns false when the ids differ', () => {
    expect(
      isSameFilter(
        makeDatasetFilter('FREQ', 'URN'),
        makeDatasetFilter('COUNTRY', 'URN'),
      ),
    ).toBe(false);
  });

  it('returns false when one is shared and the other is a dataset filter with the same id', () => {
    expect(
      isSameFilter(makeSharedFilter('COUNTRY'), makeDatasetFilter('COUNTRY')),
    ).toBe(false);
  });
});

// ─── updateFiltersWithSelectedItem ───────────────────────────────────────────

describe('updateFiltersWithSelectedItem', () => {
  const filterA = makeDatasetFilter('COUNTRY', 'URN');
  const filterB = makeDatasetFilter('FREQ', 'URN');
  const filters = [filterA, filterB];

  it('marks the matching filter as isSelectedFilter: true', () => {
    const result = updateFiltersWithSelectedItem(filters, filterA);
    expect(result[0].isSelectedFilter).toBe(true);
  });

  it('sets all non-matching filters to isSelectedFilter: false', () => {
    const result = updateFiltersWithSelectedItem(filters, filterA);
    expect(result[1].isSelectedFilter).toBe(false);
  });

  it('sets all filters to isSelectedFilter: false when selectedFilter is undefined', () => {
    const result = updateFiltersWithSelectedItem(filters, undefined);
    expect(result.every((f) => f.isSelectedFilter === false)).toBe(true);
  });
});

// ─── updateFiltersWithDisplayMode ────────────────────────────────────────────

describe('updateFiltersWithDisplayMode', () => {
  const filter = makeDatasetFilter('COUNTRY', 'URN');
  const otherFilter = makeDatasetFilter('FREQ', 'URN');
  const filters = [filter, otherFilter];

  it('updates displayMode on the matching filter', () => {
    const result = updateFiltersWithDisplayMode(
      filters,
      filter,
      FilterDisplayMode.HIERARCHY,
    );
    expect(result[0].displayMode).toBe(FilterDisplayMode.HIERARCHY);
  });

  it('does not modify other filters', () => {
    const result = updateFiltersWithDisplayMode(
      filters,
      filter,
      FilterDisplayMode.HIERARCHY,
    );
    expect(result[1].displayMode).toBeUndefined();
  });

  it('returns an empty array when filters is falsy', () => {
    expect(
      updateFiltersWithDisplayMode(
        null as any,
        filter,
        FilterDisplayMode.HIERARCHY,
      ),
    ).toEqual([]);
  });
});

// ─── getSelectedDimensionValues ───────────────────────────────────────────────

describe('getSelectedDimensionValues', () => {
  it('returns only values with isSelectedValue: true', () => {
    const values = [
      { id: 'FR', isSelectedValue: true },
      { id: 'DE', isSelectedValue: false },
      { id: 'ES', isSelectedValue: true },
    ];
    const result = getSelectedDimensionValues(values);
    expect(result).toHaveLength(2);
    expect(result.map((v) => v.id)).toEqual(['FR', 'ES']);
  });

  it('returns an empty array when no values are selected', () => {
    expect(
      getSelectedDimensionValues([{ id: 'FR', isSelectedValue: false }]),
    ).toEqual([]);
  });

  it('returns an empty array for undefined input', () => {
    expect(getSelectedDimensionValues(undefined)).toEqual([]);
  });
});

// ─── getSelectedFilterValues ──────────────────────────────────────────────────

describe('getSelectedFilterValues', () => {
  it('includes filters that have at least one selected dimension value', () => {
    const filters: Filter[] = [
      makeDatasetFilter('COUNTRY', 'URN', [
        { id: 'FR', isSelectedValue: true },
      ]),
      makeDatasetFilter('FREQ', 'URN', [{ id: 'A', isSelectedValue: false }]),
    ];
    const result = getSelectedFilterValues(filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('COUNTRY');
  });

  it('includes filters that have a timeRange with startPeriod even when dimensionValues is empty', () => {
    const timeFilter: Filter = {
      id: 'TIME',
      filterType: 'dataset',
      dimensionValues: [],
      timeRange: { startPeriod: new Date('2020-01-01'), endPeriod: null },
    };
    expect(getSelectedFilterValues([timeFilter])).toHaveLength(1);
  });

  it('excludes filters with no selected values and no timeRange', () => {
    const filters = [
      makeDatasetFilter('FREQ', 'URN', [{ id: 'A', isSelectedValue: false }]),
    ];
    expect(getSelectedFilterValues(filters)).toHaveLength(0);
  });
});

// ─── getTotalSelectedValuesLength ─────────────────────────────────────────────

describe('getTotalSelectedValuesLength', () => {
  it('sums dimension value counts across all filters', () => {
    const selectedFilters: Filter[] = [
      makeDatasetFilter('COUNTRY', 'URN', [{ id: 'FR' }, { id: 'DE' }]),
      makeDatasetFilter('FREQ', 'URN', [{ id: 'A' }]),
    ];
    expect(getTotalSelectedValuesLength(selectedFilters)).toBe(3);
  });

  it('returns 0 for an empty array', () => {
    expect(getTotalSelectedValuesLength([])).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(getTotalSelectedValuesLength(undefined as any)).toBe(0);
  });
});

// ─── clearFilterValues ────────────────────────────────────────────────────────

describe('clearFilterValues', () => {
  it('sets isSelectedValue to false on every dimension value', () => {
    const filter = makeDatasetFilter('COUNTRY', 'URN', [
      { id: 'FR', isSelectedValue: true },
      { id: 'DE', isSelectedValue: true },
    ]);
    const result = clearFilterValues(filter);
    expect(
      result.dimensionValues?.every((v) => v.isSelectedValue === false),
    ).toBe(true);
  });

  it('clears timeRange', () => {
    const filter: Filter = {
      id: 'TIME',
      filterType: 'dataset',
      timeRange: { startPeriod: new Date(), endPeriod: new Date() },
    };
    expect(clearFilterValues(filter).timeRange).toBeUndefined();
  });
});

// ─── getFiltersAfterDelete ────────────────────────────────────────────────────

describe('getFiltersAfterDelete', () => {
  it('clears the matching filter values without removing it from the array', () => {
    const countryFilter = makeDatasetFilter('COUNTRY', 'URN', [
      { id: 'FR', isSelectedValue: true },
    ]);
    const freqFilter = makeDatasetFilter('FREQ', 'URN', [
      { id: 'A', isSelectedValue: true },
    ]);

    const result = getFiltersAfterDelete(
      [countryFilter, freqFilter],
      countryFilter,
    );

    expect(result).toHaveLength(2);
    expect(result[0].dimensionValues?.[0].isSelectedValue).toBe(false);
    expect(result[1].dimensionValues?.[0].isSelectedValue).toBe(true);
  });

  it('leaves all filters unchanged when deletedFilter is undefined', () => {
    const filter = makeDatasetFilter('COUNTRY', 'URN', [
      { id: 'FR', isSelectedValue: true },
    ]);
    const result = getFiltersAfterDelete([filter], undefined);
    expect(result[0].dimensionValues?.[0].isSelectedValue).toBe(true);
  });
});

// ─── getFiltersAfterClear ─────────────────────────────────────────────────────

describe('getFiltersAfterClear', () => {
  it('clears selected values on every filter', () => {
    const filters: Filter[] = [
      makeDatasetFilter('COUNTRY', 'URN', [
        { id: 'FR', isSelectedValue: true },
      ]),
      makeDatasetFilter('FREQ', 'URN', [{ id: 'A', isSelectedValue: true }]),
    ];
    const result = getFiltersAfterClear(filters);
    expect(
      result.every((f) =>
        f.dimensionValues?.every((v) => v.isSelectedValue === false),
      ),
    ).toBe(true);
  });
});

// ─── getFiltersPreselectedByDataQuery ─────────────────────────────────────────

describe('getFiltersPreselectedByDataQuery', () => {
  const datasetUrn = 'AGENCY:DF(1.0)';
  const baseFilter = makeDatasetFilter('COUNTRY', datasetUrn, [
    { id: 'FR', isSelectedValue: false },
    { id: 'DE', isSelectedValue: false },
  ]);

  it('keeps original dimensionValues when no attachment filter matches', () => {
    const dataQuery = { urn: datasetUrn, filters: [] } as any;
    const result = getFiltersPreselectedByDataQuery([baseFilter], dataQuery);
    expect(result[0].dimensionValues).toEqual(baseFilter.dimensionValues);
  });

  it('marks matching values as selected when an attachment filter is present', () => {
    const dataQuery = {
      urn: datasetUrn,
      filters: [{ componentCode: 'COUNTRY', values: ['FR'] }],
    } as any;
    const result = getFiltersPreselectedByDataQuery([baseFilter], dataQuery);
    const values = result[0].dimensionValues!;
    expect(values.find((v) => v.id === 'FR')?.isSelectedValue).toBe(true);
    expect(values.find((v) => v.id === 'DE')?.isSelectedValue).toBe(false);
  });

  it('sets timeRange for a time dimension filter when both periods are resolved', () => {
    const start = new Date('2020-01-01');
    const end = new Date('2023-12-31');
    const mergedRange = { startPeriod: start, endPeriod: end };

    (mockGetTimePeriod as jest.Mock).mockImplementation(
      (p: string) => new Date(p),
    );
    mockGetMergedTimeRange.mockReturnValue(mergedRange);

    const timeDimFilter: Filter = {
      id: 'TIME_PERIOD',
      filterType: 'dataset',
      isTimeDimension: true,
    };
    const dataQuery = {
      urn: datasetUrn,
      filters: [
        { componentCode: 'TIME_PERIOD', values: ['2020-01-01', '2023-12-31'] },
      ],
    } as any;

    const result = getFiltersPreselectedByDataQuery([timeDimFilter], dataQuery);
    expect(result[0].timeRange).toEqual(mergedRange);
    expect(mockGetTimePeriod).toHaveBeenCalledWith('2020-01-01');
    expect(mockGetTimePeriod).toHaveBeenCalledWith('2023-12-31');
  });

  it('falls back to constraintsTimeRange when getTimePeriod returns null for both periods', () => {
    const constraintsRange = {
      startPeriod: new Date('2019-01-01'),
      endPeriod: new Date('2024-12-31'),
    };
    (mockGetAnnotationPeriod as jest.Mock).mockReturnValue(constraintsRange);
    mockGetTimePeriod.mockReturnValue(null);

    const timeDimFilter: Filter = {
      id: 'TIME_PERIOD',
      filterType: 'dataset',
      isTimeDimension: true,
    };
    const dataQuery = {
      urn: datasetUrn,
      filters: [{ componentCode: 'TIME_PERIOD', values: [] }],
    } as any;

    const result = getFiltersPreselectedByDataQuery(
      [timeDimFilter],
      dataQuery,
      [{ id: 'c1' } as any],
    );
    expect(result[0].timeRange).toEqual(constraintsRange);
  });
});

// ─── updateFiltersWithDisabledOption ─────────────────────────────────────────

describe('updateFiltersWithDisabledOption', () => {
  it('sets isDisabled: true on every filter', () => {
    const filters = [
      makeDatasetFilter('COUNTRY', 'URN'),
      makeDatasetFilter('FREQ', 'URN'),
    ];
    const result = updateFiltersWithDisabledOption(filters);
    expect(result.every((f) => f.isDisabled === true)).toBe(true);
  });

  it('preserves existing filter properties', () => {
    const filter = makeDatasetFilter('COUNTRY', 'URN', [
      { id: 'FR', isSelectedValue: true },
    ]);
    const result = updateFiltersWithDisabledOption([filter]);
    expect(result[0].dimensionValues).toEqual(filter.dimensionValues);
    expect(result[0].id).toBe('COUNTRY');
  });
});

// ─── getFilterValuesTree ──────────────────────────────────────────────────────

describe('getFilterValuesTree', () => {
  it('returns root-level nodes for values without a parent', () => {
    const tree = getFilterValuesTree([{ id: 'A' }, { id: 'B' }]);
    expect(tree).toHaveLength(2);
    expect(tree.map((n) => n.id)).toEqual(['A', 'B']);
  });

  it('nests child nodes under their parent', () => {
    const values = [
      { id: 'EUROPE' },
      { id: 'FR', parent: 'EUROPE' },
      { id: 'DE', parent: 'EUROPE' },
    ];
    const tree = getFilterValuesTree(values);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('EUROPE');
    expect(tree[0].children?.map((c) => c.id)).toEqual(['FR', 'DE']);
  });

  it('returns an empty array for undefined input', () => {
    expect(getFilterValuesTree(undefined)).toEqual([]);
  });
});

// ─── getFilterTreeNodePadding ─────────────────────────────────────────────────

describe('getFilterTreeNodePadding', () => {
  it('returns level * 24 px for a leaf node (isHasChildren = false)', () => {
    expect(getFilterTreeNodePadding(2, false)).toBe('48px');
  });

  it('returns (level * 24 - 24) px for a parent node (isHasChildren = true)', () => {
    expect(getFilterTreeNodePadding(2, true)).toBe('24px');
  });

  it('defaults to leaf behaviour when isHasChildren is omitted', () => {
    expect(getFilterTreeNodePadding(1)).toBe('24px');
  });
});

// ─── getFilterNodesBySelection ────────────────────────────────────────────────

const makeNode = (
  id: string,
  isSelectedValue: boolean,
  children: FilterTreeNodeProps[] = [],
): FilterTreeNodeProps => ({ id, isSelectedValue, children });

describe('hasSelectedDescendant', () => {
  it('returns false for a leaf node', () => {
    expect(hasSelectedDescendant(makeNode('FR', false))).toBe(false);
  });

  it('returns false when no descendant is selected', () => {
    const node = makeNode('EUROPE', false, [
      makeNode('FR', false),
      makeNode('DE', false),
    ]);
    expect(hasSelectedDescendant(node)).toBe(false);
  });

  it('returns true when at least one direct child is selected', () => {
    const node = makeNode('EUROPE', false, [
      makeNode('FR', true),
      makeNode('DE', false),
    ]);
    expect(hasSelectedDescendant(node)).toBe(true);
  });

  it('returns true when a deeply nested descendant is selected', () => {
    const node = makeNode('EUROPE', false, [
      makeNode('WEST', false, [makeNode('FR', false), makeNode('DE', true)]),
    ]);
    expect(hasSelectedDescendant(node)).toBe(true);
  });
});

describe('getFilterNodesBySelection', () => {
  it('selects a leaf node when it is not selected', () => {
    const result = getFilterNodesBySelection(makeNode('FR', false));
    expect(result[0]).toMatchObject({ id: 'FR', isSelectedValue: true });
  });

  it('deselects a leaf node when it is already selected', () => {
    const result = getFilterNodesBySelection(makeNode('FR', true));
    expect(result[0]).toMatchObject({ id: 'FR', isSelectedValue: false });
  });

  it('selects parent and all children when parent is unselected and all children are unselected', () => {
    const node = makeNode('EUROPE', false, [
      makeNode('FR', false),
      makeNode('DE', false),
    ]);
    const result = getFilterNodesBySelection(node);
    expect(result[0]).toMatchObject({ id: 'EUROPE', isSelectedValue: true });
    expect(result.slice(1).every((n) => n.isSelectedValue)).toBe(true);
  });

  it('deselects parent and all children when parent is selected and all children are selected', () => {
    const node = makeNode('EUROPE', true, [
      makeNode('FR', true),
      makeNode('DE', true),
    ]);
    const result = getFilterNodesBySelection(node);
    expect(result[0]).toMatchObject({ id: 'EUROPE', isSelectedValue: false });
    expect(result.slice(1).every((n) => !n.isSelectedValue)).toBe(true);
  });

  it('selects parent and all children when parent is unselected and all children are selected', () => {
    const node = makeNode('EUROPE', false, [
      makeNode('FR', true),
      makeNode('DE', true),
    ]);
    const result = getFilterNodesBySelection(node);
    expect(result[0]).toMatchObject({ id: 'EUROPE', isSelectedValue: true });
    expect(result.slice(1).every((n) => n.isSelectedValue)).toBe(true);
  });

  it('selects parent and all children when parent is unselected but children are mixed', () => {
    const node = makeNode('EUROPE', false, [
      makeNode('FR', true),
      makeNode('DE', false),
    ]);
    const result = getFilterNodesBySelection(node);
    expect(result[0]).toMatchObject({ id: 'EUROPE', isSelectedValue: true });
    expect(result.slice(1).every((n) => n.isSelectedValue)).toBe(true);
  });
});

// ─── getFilterNodesBySelection: selectable parent 4-state cycle ───────────────

describe('getFilterNodesBySelection (selectable parent cycle)', () => {
  const makeSelectableNode = (
    id: string,
    isSelectedValue: boolean,
    children: FilterTreeNodeProps[] = [],
  ): FilterTreeNodeProps => ({
    id,
    isSelectedValue,
    isSelectableValue: true,
    children,
  });

  const parentWith = (
    parentSelected: boolean,
    childStates: boolean[],
  ): FilterTreeNodeProps =>
    makeSelectableNode(
      'A',
      parentSelected,
      childStates.map((selected, index) =>
        makeSelectableNode(`C${index}`, selected),
      ),
    );

  it('A -> B: empty selects the parent and all children', () => {
    const result = getFilterNodesBySelection(parentWith(false, [false, false]));
    expect(result[0]).toMatchObject({ id: 'A', isSelectedValue: true });
    expect(result.slice(1).every((n) => n.isSelectedValue)).toBe(true);
  });

  it('B -> C: full selection deselects the parent but keeps children', () => {
    const result = getFilterNodesBySelection(parentWith(true, [true, true]));
    expect(result[0]).toMatchObject({ id: 'A', isSelectedValue: false });
    expect(result.slice(1).every((n) => n.isSelectedValue)).toBe(true);
  });

  it('C -> D: children-only selects the parent and clears children', () => {
    const result = getFilterNodesBySelection(parentWith(false, [true, true]));
    expect(result[0]).toMatchObject({ id: 'A', isSelectedValue: true });
    expect(result.slice(1).every((n) => !n.isSelectedValue)).toBe(true);
  });

  it('D -> A: parent-only clears everything', () => {
    const result = getFilterNodesBySelection(parentWith(true, [false, false]));
    expect(result[0]).toMatchObject({ id: 'A', isSelectedValue: false });
    expect(result.slice(1).every((n) => !n.isSelectedValue)).toBe(true);
  });

  it('normalizes a mixed state (parent + partial children) to full selection', () => {
    const result = getFilterNodesBySelection(parentWith(true, [true, false]));
    expect(result[0]).toMatchObject({ id: 'A', isSelectedValue: true });
    expect(result.slice(1).every((n) => n.isSelectedValue)).toBe(true);
  });

  it('treats children-only as the trigger for D regardless of partial selection', () => {
    const result = getFilterNodesBySelection(parentWith(false, [true, false]));
    expect(result[0]).toMatchObject({ id: 'A', isSelectedValue: true });
    expect(result.slice(1).every((n) => !n.isSelectedValue)).toBe(true);
  });
});

// ─── getNewHierarchyFilterValues ──────────────────────────────────────────────

describe('getNewHierarchyFilterValues', () => {
  const node = (
    id: string,
    overrides: Partial<FilterTreeNodeProps> = {},
  ): FilterTreeNodeProps => ({
    id,
    name: id,
    isSelectedValue: true,
    children: [],
    ...overrides,
  });

  it('adds a missing codelist-backed node', () => {
    const result = getNewHierarchyFilterValues(
      [node('CODE', { isSelectableValue: true })],
      new Set(),
    );
    expect(result).toEqual([
      { id: 'CODE', name: 'CODE', isSelectedValue: true },
    ]);
  });

  it('does NOT add a node that is not in the codelist', () => {
    const result = getNewHierarchyFilterValues(
      [node('CODE', { isSelectableValue: false })],
      new Set(),
    );
    expect(result).toEqual([]);
  });

  it('skips a node that already exists', () => {
    const result = getNewHierarchyFilterValues(
      [node('CODE', { isSelectableValue: true })],
      new Set(['CODE']),
    );
    expect(result).toEqual([]);
  });

  it('adds a missing selectable aggregate parent from a multi-node call', () => {
    const result = getNewHierarchyFilterValues(
      [
        node('A', { isSelectableValue: true }),
        node('A1', { isSelectableValue: true }),
        node('A2', { isSelectableValue: true }),
      ],
      new Set(['A1', 'A2']),
    );
    expect(result).toEqual([{ id: 'A', name: 'A', isSelectedValue: true }]);
  });

  it('does NOT add non-selectable structural parents from a multi-node call', () => {
    const result = getNewHierarchyFilterValues(
      [
        node('GROUP', { isSelectableValue: false }),
        node('FR', { isSelectableValue: true }),
      ],
      new Set(['FR']),
    );
    expect(result).toEqual([]);
  });

  it('preserves the deselected state of an added parent', () => {
    const result = getNewHierarchyFilterValues(
      [
        node('A', { isSelectableValue: true, isSelectedValue: false }),
        node('A1', { isSelectableValue: true }),
      ],
      new Set(['A1']),
    );
    expect(result).toEqual([{ id: 'A', name: 'A', isSelectedValue: false }]);
  });
});

describe('getHierarchyOptions', () => {
  it('returns flat list option by default', () => {
    const options = getHierarchyOptions({});
    expect(options).toEqual([{ key: '', title: 'Flat list' }]);
  });

  it('adds hierarchy mode option when filter supports hierarchy', () => {
    const options = getHierarchyOptions({ isHierarchical: true });
    expect(options).toEqual([
      { key: '', title: 'Flat list' },
      {
        key: FilterDisplayMode.HIERARCHY,
        title: 'Hierarchy by parent',
      },
    ]);
  });

  it('adds available hierarchy entries and applies localized titles', () => {
    const options = getHierarchyOptions({
      isHierarchical: true,
      titles: {
        flatList: 'Flachliste',
        hierarchy: 'Baumstruktur',
      } as any,
      availableHierarchies: [
        { id: 'H1', name: 'Geo', version: '1.0' } as any,
        { id: 'H2', version: '2.0' } as any,
      ],
    });

    expect(options).toEqual([
      { key: '', title: 'Flachliste' },
      { key: FilterDisplayMode.HIERARCHY, title: 'Baumstruktur' },
      { key: 'H1', title: 'Geo (1.0)' },
      { key: 'H2', title: 'H2 (2.0)' },
    ]);
  });
});

// ─── getDatasetFilters ────────────────────────────────────────────────────────

describe('getDatasetFilters', () => {
  it('returns an empty array when dimensions is undefined', () => {
    expect(getDatasetFilters(undefined)).toEqual([]);
  });

  it('builds one filter per dimension with id, title, values, and correct metadata', () => {
    const dimValues = [{ id: 'A', name: 'Annual', isSelectedValue: false }];
    mockGetAvailableCodes.mockReturnValue(dimValues);
    mockGetDimensionTitle.mockReturnValue('Frequency');

    const dimensions = [{ id: 'FREQ', type: 'Dimension' }] as any[];
    const result = getDatasetFilters(
      dimensions,
      undefined,
      undefined,
      'en',
      'AGENCY:DF(1.0)',
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'FREQ',
      title: 'Frequency',
      dimensionValues: dimValues,
      datasetUrn: 'AGENCY:DF(1.0)',
      filterType: 'dataset',
      isTimeDimension: false,
      displayMode: FilterDisplayMode.FLAT_LIST,
    });
  });

  it('sets isTimeDimension: true for a TIME_DIMENSION type dimension', () => {
    const dimensions = [{ id: 'TIME_PERIOD', type: 'TimeDimension' }] as any[];
    const result = getDatasetFilters(dimensions);
    expect(result[0].isTimeDimension).toBe(true);
  });

  it('sets isHierarchical: true and displayMode: HIERARCHY when codes have parent references', () => {
    mockFindCodelistByDimension.mockReturnValue({
      codes: [{ id: 'EUROPE' }, { id: 'FR', parent: 'EUROPE' }],
    });

    const dimensions = [{ id: 'GEO', type: 'Dimension' }] as any[];
    const result = getDatasetFilters(dimensions);

    expect(result[0].isHierarchical).toBe(true);
    expect(result[0].displayMode).toBe(FilterDisplayMode.HIERARCHY);
  });
});

// ─── getSelectedFilterValues — isSelectedFilter does not affect output ────────

describe('getSelectedFilterValues — isSelectedFilter does not affect output', () => {
  it('does not filter based on isSelectedFilter: true', () => {
    const base: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      dimensionValues: [{ id: 'A', isSelectedValue: true }],
    };

    const withFlag = getSelectedFilterValues([{ ...base, isSelectedFilter: true }]);

    expect(withFlag).toHaveLength(1);
    expect(withFlag[0].id).toBe('FREQ');
  });

  it('does not filter based on isSelectedFilter: false', () => {
    const base: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      dimensionValues: [{ id: 'A', isSelectedValue: true }],
    };

    const withFalse = getSelectedFilterValues([{ ...base, isSelectedFilter: false }]);

    expect(withFalse).toHaveLength(1);
    expect(withFalse[0].id).toBe('FREQ');
  });

  it('filters consistently regardless of isSelectedFilter value', () => {
    const base: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      dimensionValues: [{ id: 'A', isSelectedValue: false }],
    };

    const resultWithoutFlag = getSelectedFilterValues([{ ...base }]);
    const resultWithTrue = getSelectedFilterValues([{ ...base, isSelectedFilter: true }]);
    const resultWithFalse = getSelectedFilterValues([{ ...base, isSelectedFilter: false }]);

    expect(resultWithoutFlag).toEqual(resultWithTrue);
    expect(resultWithoutFlag).toEqual(resultWithFalse);
  });
});

// ─── updateFiltersWithSelectedItem — preserves query-relevant fields ─────────

describe('updateFiltersWithSelectedItem — preserves query-relevant fields', () => {
  it('only changes isSelectedFilter, leaving dimensionValues and id intact', () => {
    const filter: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      dimensionValues: [{ id: 'A', isSelectedValue: true }],
    };

    const result = updateFiltersWithSelectedItem([filter], filter);

    expect(result[0].id).toBe(filter.id);
    expect(result[0].dimensionValues).toEqual(filter.dimensionValues);
    expect(result[0].isSelectedFilter).toBe(true);
  });

  it('sets isSelectedFilter to false on non-matching filters, leaving their data intact', () => {
    const selected: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      dimensionValues: [{ id: 'A', isSelectedValue: true }],
    };
    const other: Filter = {
      id: 'GEO',
      filterType: 'dataset',
      dimensionValues: [{ id: 'US', isSelectedValue: true }],
    };

    const result = updateFiltersWithSelectedItem([selected, other], selected);

    expect(result[1].dimensionValues).toEqual(other.dimensionValues);
    expect(result[1].isSelectedFilter).toBe(false);
  });
});
