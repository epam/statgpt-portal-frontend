import {
  getDimensionTitle,
  getDimensions,
  getLocalizedName,
} from '@epam/statgpt-sdmx-toolkit';
import type {
  DatasetDimensionsScheme,
  DimensionConfig,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import type { DraggableListItemNode } from '@epam/statgpt-ui-components';
import {
  applyDimensionKeyCustomization,
  buildCrossDatasetEnrichItem,
} from '../crossDatasetEnrichment';
import { buildDimensionSubItemId } from '../dimensionSubItemId';
import {
  COUNTRY_COL_ID,
  FREQUENCY_COL_ID,
  INDICATOR_COL_ID,
} from '../../../../../constants/cross-dataset-grid';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getDimensions: jest.fn(),
  getDimensionTitle: jest.fn(),
  getLocalizedName: jest.fn(),
}));

const mockGetDimensions = getDimensions as jest.Mock;
const mockGetDimensionTitle = getDimensionTitle as jest.Mock;
const mockGetLocalizedName = getLocalizedName as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(id: string): DraggableListItemNode {
  return { type: 'item', id, label: id };
}

function makeScheme(
  overrides: Partial<DatasetDimensionsScheme> = {},
): DatasetDimensionsScheme {
  return {
    timePeriod: undefined,
    frequency: undefined,
    region: undefined,
    indicators: [],
    other: [],
    ...overrides,
  };
}

function makeInfo(overrides: {
  dataQueries?: Array<{ urn: string }>;
  structuresMap?: Map<string, StructuralData | undefined>;
  getDimensionsScheme?: (urn: string) => DatasetDimensionsScheme | undefined;
  getDimensionConfig?: (
    urn: string,
    dimKey: string,
  ) => DimensionConfig | undefined;
  locale?: string;
  dimensionCustomization?: Map<
    string,
    Map<string, { order: string[]; hidden: Set<string> }>
  >;
}) {
  return {
    dataQueries: [],
    structuresMap: new Map(),
    getDimensionsScheme: () => undefined,
    getDimensionConfig: () => undefined,
    locale: 'en',
    ...overrides,
  };
}

// Minimal DimensionConfig with alias set
function aliasConfig(alias: string): DimensionConfig {
  return {
    alias,
    subtype: null,
    allValues: null,
    dimensionType: 'NON_INDICATOR',
  };
}

// ---------------------------------------------------------------------------
// applyDimensionKeyCustomization
// ---------------------------------------------------------------------------

describe('applyDimensionKeyCustomization', () => {
  it('returns keys unchanged when custom is undefined', () => {
    expect(applyDimensionKeyCustomization(['A', 'B', 'C'], undefined)).toEqual([
      'A',
      'B',
      'C',
    ]);
  });

  it('returns keys unchanged when order and hidden are both empty', () => {
    expect(
      applyDimensionKeyCustomization(['A', 'B', 'C'], {
        order: [],
        hidden: new Set(),
      }),
    ).toEqual(['A', 'B', 'C']);
  });

  it('reorders keys according to custom.order, appending unlisted keys at the end', () => {
    expect(
      applyDimensionKeyCustomization(['A', 'B', 'C'], {
        order: ['C', 'A'],
        hidden: new Set(),
      }),
    ).toEqual(['C', 'A', 'B']);
  });

  it('ignores order entries that are not present in dimensionKeys', () => {
    expect(
      applyDimensionKeyCustomization(['A', 'B'], {
        order: ['X', 'B', 'A'],
        hidden: new Set(),
      }),
    ).toEqual(['B', 'A']);
  });

  it('filters out hidden keys', () => {
    expect(
      applyDimensionKeyCustomization(['A', 'B', 'C'], {
        order: [],
        hidden: new Set(['B']),
      }),
    ).toEqual(['A', 'C']);
  });

  it('reorders and then filters hidden keys', () => {
    expect(
      applyDimensionKeyCustomization(['A', 'B', 'C'], {
        order: ['C', 'A', 'B'],
        hidden: new Set(['A']),
      }),
    ).toEqual(['C', 'B']);
  });
});

// ---------------------------------------------------------------------------
// buildCrossDatasetEnrichItem
// ---------------------------------------------------------------------------

describe('buildCrossDatasetEnrichItem', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetLocalizedName.mockReturnValue('My Dataset');
    mockGetDimensions.mockReturnValue({ dimensions: [] });
    mockGetDimensionTitle.mockReturnValue(undefined);
  });

  it('returns the item unchanged when its colId is not an aggregated column', () => {
    const enrich = buildCrossDatasetEnrichItem(makeInfo({}));
    const item = makeItem('some_regular_col');
    expect(enrich(item)).toBe(item);
  });

  it('returns the item unchanged when dataQueries is empty', () => {
    const enrich = buildCrossDatasetEnrichItem(makeInfo({ dataQueries: [] }));
    const item = makeItem(INDICATOR_COL_ID);
    expect(enrich(item)).toBe(item);
  });

  it('returns the item unchanged when the scheme has no keys for the colId', () => {
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn: 'urn:abc' }],
        getDimensionsScheme: () => makeScheme({ indicators: [] }),
        getDimensionConfig: () => undefined,
      }),
    );
    const item = makeItem(INDICATOR_COL_ID);
    expect(enrich(item)).toBe(item);
  });

  it('builds one group per dataset for INDICATOR_COL_ID', () => {
    const urn = 'urn:abc';
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn }],
        getDimensionsScheme: () => makeScheme({ indicators: ['IND1', 'IND2'] }),
        getDimensionConfig: (_, dimKey) => aliasConfig(dimKey + '_label'),
      }),
    );
    const result = enrich(makeItem(INDICATOR_COL_ID));

    expect(result.items).toHaveLength(1);
    const group = result.items![0];
    expect(group.type).toBe('group');
    expect(group.id).toBe(urn);
  });

  it('builds leaf items with encoded ids and alias labels', () => {
    const urn = 'urn:abc';
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn }],
        getDimensionsScheme: () => makeScheme({ indicators: ['IND1', 'IND2'] }),
        getDimensionConfig: (_, dimKey) => aliasConfig(dimKey + '_label'),
      }),
    );
    const result = enrich(makeItem(INDICATOR_COL_ID));
    const group = result.items![0];
    if (group.type !== 'group') throw new Error('expected group');

    expect(group.items).toHaveLength(2);
    expect(group.items[0]).toMatchObject({
      id: buildDimensionSubItemId(urn, 'IND1'),
      label: 'IND1_label',
      type: 'item',
    });
    expect(group.items[1]).toMatchObject({
      id: buildDimensionSubItemId(urn, 'IND2'),
      label: 'IND2_label',
    });
  });

  it('sets draggable and checkable to true when there are multiple dimension keys', () => {
    const urn = 'urn:abc';
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn }],
        getDimensionsScheme: () => makeScheme({ indicators: ['IND1', 'IND2'] }),
        getDimensionConfig: (_, dimKey) => aliasConfig(dimKey),
      }),
    );
    const result = enrich(makeItem(INDICATOR_COL_ID));
    const group = result.items![0];
    if (group.type !== 'group') throw new Error('expected group');

    for (const leaf of group.items) {
      if (leaf.type === 'item') {
        expect(leaf.draggable).toBe(true);
        expect(leaf.checkable).toBe(true);
      }
    }
  });

  it('sets draggable and checkable to false when there is only one dimension key', () => {
    const urn = 'urn:abc';
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn }],
        getDimensionsScheme: () => makeScheme({ region: 'COUNTRY' }),
        getDimensionConfig: () => aliasConfig('Country'),
      }),
    );
    const result = enrich(makeItem(COUNTRY_COL_ID));
    const group = result.items![0];
    if (group.type !== 'group') throw new Error('expected group');
    const leaf = group.items[0];
    if (leaf.type === 'item') {
      expect(leaf.draggable).toBe(false);
      expect(leaf.checkable).toBe(false);
    }
  });

  it('marks hidden dimension keys as isChecked: false', () => {
    const urn = 'urn:abc';
    const dimensionCustomization = new Map([
      [
        urn,
        new Map([[INDICATOR_COL_ID, { order: [], hidden: new Set(['IND1']) }]]),
      ],
    ]);
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn }],
        getDimensionsScheme: () => makeScheme({ indicators: ['IND1', 'IND2'] }),
        getDimensionConfig: (_, dimKey) => aliasConfig(dimKey),
        dimensionCustomization,
      }),
    );
    const result = enrich(makeItem(INDICATOR_COL_ID));
    const group = result.items![0];
    if (group.type !== 'group') throw new Error('expected group');

    const ind1 = group.items.find(
      (i) => i.id === buildDimensionSubItemId(urn, 'IND1'),
    );
    const ind2 = group.items.find(
      (i) => i.id === buildDimensionSubItemId(urn, 'IND2'),
    );
    expect(ind1?.type === 'item' && ind1.isChecked).toBe(false);
    expect(ind2?.type === 'item' && ind2.isChecked).toBe(true);
  });

  it('uses getLocalizedName for the group label', () => {
    const urn = 'urn:abc';
    mockGetLocalizedName.mockReturnValue('Localized Dataset Name');
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn }],
        getDimensionsScheme: () => makeScheme({ indicators: ['IND1'] }),
        getDimensionConfig: () => aliasConfig('IND1'),
      }),
    );
    const result = enrich(makeItem(INDICATOR_COL_ID));
    const group = result.items![0];
    expect(group.label).toBe('Localized Dataset Name');
  });

  it('falls back to urn as group label when getLocalizedName returns undefined', () => {
    const urn = 'urn:abc';
    mockGetLocalizedName.mockReturnValue(undefined);
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn }],
        getDimensionsScheme: () => makeScheme({ indicators: ['IND1'] }),
        getDimensionConfig: () => aliasConfig('IND1'),
      }),
    );
    const result = enrich(makeItem(INDICATOR_COL_ID));
    const group = result.items![0];
    expect(group.label).toBe(urn);
  });

  it('handles FREQUENCY_COL_ID by reading scheme.frequency', () => {
    const urn = 'urn:abc';
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn }],
        getDimensionsScheme: () => makeScheme({ frequency: 'FREQ' }),
        getDimensionConfig: () => aliasConfig('Annual'),
      }),
    );
    const result = enrich(makeItem(FREQUENCY_COL_ID));
    expect(result.items).toHaveLength(1);
    const group = result.items![0];
    if (group.type !== 'group') throw new Error('expected group');
    expect(group.items[0].id).toBe(buildDimensionSubItemId(urn, 'FREQ'));
  });

  it('resolves label via getDimensionTitle when no alias is configured', () => {
    const urn = 'urn:abc';
    mockGetDimensions.mockReturnValue({
      dimensions: [{ id: 'IND1' }],
    });
    mockGetDimensionTitle.mockReturnValue('Title From Scheme');
    const enrich = buildCrossDatasetEnrichItem(
      makeInfo({
        dataQueries: [{ urn }],
        structuresMap: new Map([[urn, {} as StructuralData]]),
        getDimensionsScheme: () => makeScheme({ indicators: ['IND1'] }),
        getDimensionConfig: () => undefined,
      }),
    );
    const result = enrich(makeItem(INDICATOR_COL_ID));
    const group = result.items![0];
    if (group.type !== 'group') throw new Error('expected group');
    expect(group.items[0]).toMatchObject({ label: 'Title From Scheme' });
  });
});
