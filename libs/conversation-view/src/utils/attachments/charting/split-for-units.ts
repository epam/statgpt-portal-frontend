import { GridData } from '@statgpt/conversation-view/src/types/data-grid/grid-data';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { ChartUnitRows } from '@statgpt/conversation-view/src/models/charting';
import { getDimValue } from '@statgpt/conversation-view/src/utils/attachments/localized-value';

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
