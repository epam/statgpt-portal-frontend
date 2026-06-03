import { Codelist, Data, ElementBase } from '@epam/statgpt-sdmx-toolkit';
import { getDataSetAttributes, getStructureAttributes } from '../metadata';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getLocalizedName: (
    item: { names?: Record<string, string>; name?: string } | undefined | null,
    locale: string,
  ) => (item?.names && item.names[locale]) || item?.name,
}));

const LOCALE = 'en';

function buildData(
  structureDataSet: unknown[],
  dataSetAttributes: unknown[],
): Data {
  return {
    dataSets: [{ attributes: dataSetAttributes as (number | null)[] }],
    structures: [
      {
        attributes: { dataSet: structureDataSet },
        dimensions: { dataSet: [] },
        measures: { dataSet: [] },
      },
    ],
  } as unknown as Data;
}

const emptyComponentsMap = new Map<string, Codelist | ElementBase>();

describe('getStructureAttributes', () => {
  it('returns structure attributes as-is when there are no dataSet value indices', () => {
    const structureDataSet = [{ id: 'DOI', values: [] }];
    const data = buildData(structureDataSet, []);

    expect(getStructureAttributes(data)).toBe(
      data.structures?.[0]?.attributes?.dataSet,
    );
  });

  it('skips attributes whose dataSet value is null', () => {
    const data = buildData(
      [
        { id: 'DOI', values: [] },
        { id: 'AUTHOR', values: [] },
      ],
      [null, null],
    );

    expect(getStructureAttributes(data)).toEqual([]);
  });

  it('selects the value by index for coded attributes', () => {
    const data = buildData([{ id: 'PUBLISHER', values: [{ id: 'IMF' }] }], [0]);

    expect(getStructureAttributes(data)).toEqual([
      { id: 'PUBLISHER', values: [{ id: 'IMF' }] },
    ]);
  });

  it('preserves a raw array value under "values" instead of coercing to a string', () => {
    const rawValue = [{ en: 'Demographics' }, { en: ' Real sector' }];
    const data = buildData(
      [{ id: 'KEYWORDS_DATASET', values: [] }],
      [rawValue],
    );

    expect(getStructureAttributes(data)).toEqual([
      { id: 'KEYWORDS_DATASET', values: [{ values: rawValue }] },
    ]);
  });

  it('preserves a non-array raw value under "value" instead of coercing to a string', () => {
    const rawValue = { en: 'A note' };
    const data = buildData([{ id: 'NOTE', values: [] }], [rawValue]);

    expect(getStructureAttributes(data)).toEqual([
      { id: 'NOTE', values: [{ value: rawValue }] },
    ]);
  });
});

describe('getDataSetAttributes', () => {
  it('resolves a localized free-text array value to a readable string (no [object Object])', () => {
    const data = buildData(
      [{ id: 'FULL_DESCRIPTION', values: [] }],
      [[{ en: 'The World Economic Outlook database.' }]],
    );

    const result = getDataSetAttributes(
      getStructureAttributes(data),
      emptyComponentsMap,
      LOCALE,
    );

    expect(result).toEqual([
      {
        id: 'FULL_DESCRIPTION',
        title: 'FULL_DESCRIPTION',
        value: ['The World Economic Outlook database.'],
      },
    ]);
  });

  it('resolves a multi-value localized array to a list of readable strings', () => {
    const data = buildData(
      [{ id: 'KEYWORDS_DATASET', values: [] }],
      [
        [
          { en: 'Demographics' },
          { en: ' Real sector' },
          { en: ' Unemployment' },
        ],
      ],
    );

    const result = getDataSetAttributes(
      getStructureAttributes(data),
      emptyComponentsMap,
      LOCALE,
    );

    expect(result[0]?.value).toEqual([
      'Demographics',
      ' Real sector',
      ' Unemployment',
    ]);
  });

  it('passes plain string array values through unchanged', () => {
    const data = buildData(
      [{ id: 'CONTACT_POINT', values: [] }],
      [['datahelp@imf.org']],
    );

    const result = getDataSetAttributes(
      getStructureAttributes(data),
      emptyComponentsMap,
      LOCALE,
    );

    expect(result[0]?.value).toEqual(['datahelp@imf.org']);
  });

  it('resolves coded id values via the structure components map', () => {
    const componentsMap = new Map<string, Codelist | ElementBase>([
      [
        'PUBLISHER',
        {
          id: 'PUBLISHER',
          codes: [{ id: 'IMF', names: { en: 'International Monetary Fund' } }],
        } as unknown as Codelist,
      ],
    ]);
    const data = buildData([{ id: 'PUBLISHER', values: [{ id: 'IMF' }] }], [0]);

    const result = getDataSetAttributes(
      getStructureAttributes(data),
      componentsMap,
      LOCALE,
    );

    expect(result[0]?.value).toBe('International Monetary Fund');
  });

  it('never emits "[object Object]" for the real WEO dataset attributes', () => {
    const structureDataSet = [
      { id: 'DOI', values: [] },
      { id: 'FULL_DESCRIPTION', values: [] },
      { id: 'CONTACT_POINT', values: [] },
      { id: 'KEYWORDS_DATASET', values: [] },
    ];
    const dataSetAttributes = [
      null,
      [{ en: 'WEO database description.' }],
      ['datahelp@imf.org'],
      [{ en: 'Demographics' }, { en: ' Real sector' }],
    ];
    const data = buildData(structureDataSet, dataSetAttributes);

    const result = getDataSetAttributes(
      getStructureAttributes(data),
      emptyComponentsMap,
      LOCALE,
    );

    const flattened = result
      .flatMap((item) =>
        Array.isArray(item.value) ? item.value : [item.value],
      )
      .join(' ');

    expect(flattened).not.toContain('[object Object]');
  });
});
