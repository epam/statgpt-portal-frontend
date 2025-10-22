import { GridData } from '../../../types/data-grid/grid-data';
import { StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { ChartUnitRows } from '../../../models/charting';
import { getDimValue } from '../localized-value';

export function splitForUnits(
  rows: GridData[],
  notUniqDimensions: string[],
  structures: StructuralData,
): ChartUnitRows[] {
  const unitsMap: Record<string, ChartUnitRows> = {};
  rows.forEach((row) => {
    const key = getSerieKey(row, notUniqDimensions, structures);
    if (!unitsMap[key]) {
      unitsMap[key] = {
        rows: [],
      };
    }
    unitsMap[key].rows.push(row);
  });
  return Object.keys(unitsMap).map((key) => unitsMap[key]);
}

function getSerieKey(
  serie: GridData,
  dimensionsKeys: string[],
  structures: StructuralData,
): string {
  const dimensions =
    structures.dataStructures?.[0]?.dataStructureComponents?.dimensionList
      ?.dimensions || [];
  const keys = dimensionsKeys.map((dimKey) => {
    const dimension = dimensions?.find((dim) => dim.id === dimKey);
    if (dimension == null) {
      return serie[dimKey] || '';
    }
    return getDimValue(dimensions, dimKey, serie);
  });
  return keys.join(' - ');
}
