import {
  DataConstraints,
  Dimension,
  findCodelistByDimension,
  getAvailableCodesFromConstrains,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { Filter } from '../models/filters';
import { Locale } from '@epam/statgpt-shared-toolkit';

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
