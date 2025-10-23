import { StructuralData, getDimensions } from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

export function buildSortedNonRegionDimensionsList(
  structures: StructuralData,
  dataQuery: DataQuery | undefined,
): string[] {
  const primaryDimensions = [
    ...(dataQuery?.metadata?.indicatorDimensions || []),
  ].filter((dim) => dim != null);
  const allDimensions = getDimensions(structures)?.dimensions;
  const restDimensions =
    allDimensions
      ?.filter(
        (dim) =>
          dim.id != null &&
          !primaryDimensions.includes(dim.id) &&
          dataQuery?.metadata?.countryDimension !== dim.id,
      )
      .map((dim) => dim.id)
      .filter((dim) => dim != null) || [];
  return [...primaryDimensions, ...restDimensions];
}
