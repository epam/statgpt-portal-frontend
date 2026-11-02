import { Attachment } from '@epam/ai-dial-shared';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { excludeDatasetDataTables } from '../exclude-dataset-data-tables';

const table = (title?: string): Attachment =>
  ({ type: 'application/dial-ttyd-table', title }) as Attachment;

const query = (title?: string): DataQuery =>
  ({ title, urn: 'urn:test', metadata: {} }) as unknown as DataQuery;

describe('excludeDatasetDataTables', () => {
  const DATASET_A = 'AGENCY.ONE:DATASET_A(1.0.0)';
  const DATASET_B = 'AGENCY.TWO:DATASET_B(1.0.0)';

  it('drops the data table of a dataset that has a data query', () => {
    const result = excludeDatasetDataTables(
      [table(`Data: ${DATASET_A}`)],
      [query(`Query (JSON): ${DATASET_A}`)],
    );

    expect(result).toEqual([]);
  });

  it('drops data tables of every dataset that has a data query', () => {
    const result = excludeDatasetDataTables(
      [table(`Data: ${DATASET_A}`), table(`Data: ${DATASET_B}`)],
      [
        query(`Query (JSON): ${DATASET_A}`),
        query(`Query (JSON): ${DATASET_B}`),
      ],
    );

    expect(result).toEqual([]);
  });

  it('keeps a data table whose dataset has no data query', () => {
    const datasetBTable = table(`Data: ${DATASET_B}`);

    const result = excludeDatasetDataTables(
      [table(`Data: ${DATASET_A}`), datasetBTable],
      [query(`Query (JSON): ${DATASET_A}`)],
    );

    expect(result).toEqual([datasetBTable]);
  });

  it('keeps missing-dimension tables next to a data query', () => {
    const pickList = table('Country (COUNTRY)');

    const result = excludeDatasetDataTables(
      [pickList, table(`Data: ${DATASET_A}`)],
      [query(`Query (JSON): ${DATASET_A}`)],
    );

    expect(result).toEqual([pickList]);
  });

  it('splits only on the first separator so ids containing ":" still match', () => {
    const result = excludeDatasetDataTables(
      [table('Data: A:B: C')],
      [query('Query (JSON): A:B: C')],
    );

    expect(result).toEqual([]);
  });

  it('returns all tables when there are no data queries', () => {
    const tables = [table(`Data: ${DATASET_A}`)];

    expect(excludeDatasetDataTables(tables, undefined)).toEqual(tables);
    expect(excludeDatasetDataTables(tables, [])).toEqual(tables);
  });

  it('keeps tables when data queries have no usable title', () => {
    const tables = [table(`Data: ${DATASET_A}`)];

    expect(
      excludeDatasetDataTables(tables, [
        query(undefined),
        query('NoSeparator'),
      ]),
    ).toEqual(tables);
  });

  it('keeps tables with missing or separator-less titles', () => {
    const tables = [table(undefined), table('Plain title')];

    expect(
      excludeDatasetDataTables(tables, [query(`Query (JSON): ${DATASET_A}`)]),
    ).toEqual(tables);
  });

  it('returns an empty array for empty input', () => {
    expect(
      excludeDatasetDataTables([], [query(`Query (JSON): ${DATASET_A}`)]),
    ).toEqual([]);
  });
});
