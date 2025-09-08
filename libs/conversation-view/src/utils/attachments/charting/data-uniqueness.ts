import { GridData } from '@statgpt/conversation-view/src/types/data-grid/grid-data';

export function getDimensionsUniquenessByValues(
  dimensionsKeys: string[],
  rows: GridData[],
): { nonUniqDimensions: string[] } {
  const dimensionsUniqueness: Record<string, boolean> = {};
  dimensionsKeys.forEach(
    (dimensionKey: string) =>
      (dimensionsUniqueness[dimensionKey] = isAllRowsHasSameDimValues(
        dimensionKey,
        rows,
      )),
  );
  return {
    nonUniqDimensions: dimensionsKeys.filter(
      (value) => !dimensionsUniqueness[value],
    ),
  };
}

function isAllRowsHasSameDimValues(dimKey: string, rows: GridData[]): boolean {
  const values = rows.map((row) => getRowValue(dimKey, row));
  const uniqValues = new Set(values);
  return uniqValues.size === 1;
}

function getRowValue(dimKey: string, row: GridData): unknown {
  return row[dimKey];
}
