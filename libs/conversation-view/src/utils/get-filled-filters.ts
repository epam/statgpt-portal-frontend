import { Filter } from '@statgpt/conversation-view/src/models/filters';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { DataConstraints } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/constraints';
import { Locale } from '@statgpt/shared-toolkit/src/types/locale';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { findCodelistByDimension } from '@statgpt/sdmx-toolkit/src/utils/find-codelist-by-dimension';
import { getAvailableCodesFromConstrains } from '@statgpt/sdmx-toolkit/src/utils/constraint';

export const getFilledFilters = (
  filters?: Filter[],
  dimensions?: Dimension[],
  structures?: StructuralData,
  contentConstraints?: DataConstraints[],
  locale = Locale.EN,
) => {
  const filledDimensions = dimensions?.map((dimension) => {
    const codeList = findCodelistByDimension(
      structures?.codelists,
      structures?.conceptSchemes,
      dimension,
    );
    const availableTerms = getAvailableCodesFromConstrains(
      codeList?.codes,
      dimension.id,
      contentConstraints,
      locale,
    );
    return {
      ...dimension,
      dimensionValues: availableTerms,
    };
  });

  return (
    filters?.map((filter) => {
      const dimensionValues =
        filledDimensions?.find((dim) => dim.id === filter.id)
          ?.dimensionValues || [];
      const mappedSelectionValues = dimensionValues.map((value) => {
        const isSelectedValue = filter.dimensionValues?.find(
          (dimension) => dimension?.id === value?.id,
        )?.isSelectedValue;
        return {
          ...value,
          isSelectedValue: isSelectedValue,
        };
      });
      return {
        ...filter,
        isDisabled: false,
        dimensionValues: mappedSelectionValues,
      };
    }) || []
  );
};
