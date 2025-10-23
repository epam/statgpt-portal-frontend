import { getDimensions, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { GridData } from '../../../types/data-grid/grid-data';
import {
  getDimRelatedStructures,
  getDimValueLocalizedName,
} from '../localized-value';

export function buildSerieKeyTitle(
  serie: GridData,
  dimensionsKeys: string[],
  structures: StructuralData,
  locale: string,
): string {
  const keys = dimensionsKeys.map((dimKey) => {
    const dimensions = getDimensions(structures)?.dimensions || [];
    const dimension = dimensions?.find((dim) => dim.id === dimKey);
    if (dimension == null) {
      return serie[dimKey] || '';
    }
    const { codeList } = getDimRelatedStructures(
      dimension,
      structures.conceptSchemes || [],
      structures.codelists || [],
    );
    return getDimValueLocalizedName(
      dimensions,
      dimKey,
      codeList,
      serie,
      locale,
    );
  });
  return keys.join(' - ');
}
