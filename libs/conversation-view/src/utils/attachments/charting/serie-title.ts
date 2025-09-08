import { GridData } from '@statgpt/conversation-view/src/types/data-grid/grid-data';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import {
  getDimRelatedStructures,
  getDimValueLocalizedName,
} from '@statgpt/conversation-view/src/utils/attachments/localized-value';
import { getDimensions } from '@statgpt/sdmx-toolkit/src/utils/get-dimensions';

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
