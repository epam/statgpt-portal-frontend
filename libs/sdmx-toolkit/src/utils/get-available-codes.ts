import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { StructureItemBase } from '@statgpt/sdmx-toolkit/src/models/data/structure';
import { getLocalizedName } from '@statgpt/sdmx-toolkit/src/utils/get-localized-name';
import { Codelist } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/codelist';

export const getAvailableCodes = (
  dimension?: Dimension,
  structureDimensions?: StructureItemBase[],
  codes?: Codelist[],
  locale?: string,
): Codelist[] => {
  const dimensionValues = structureDimensions?.find(
    (structureDimension) => structureDimension?.id === dimension?.id,
  )?.values;

  return (
    codes
      ?.filter((code) => dimensionValues?.some((value) => value.id === code.id))
      ?.map((code) => ({
        ...code,
        name: locale ? getLocalizedName(code, locale) : code?.name,
      })) || []
  );
};
