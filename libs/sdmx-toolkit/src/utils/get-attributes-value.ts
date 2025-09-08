import {
  DimensionValue,
  StructureAttribute,
} from '@statgpt/sdmx-toolkit/src/models/data/structure';
import { AttributeIndexValue } from '@statgpt/sdmx-toolkit/src/types/attribute-index-value';

export const getAttributeValueFromDataQueryResponse = (
  attribute: StructureAttribute,
  valueIndex?: AttributeIndexValue,
): DimensionValue | undefined => {
  if (valueIndex == null) {
    return void 0;
  }

  const value = attribute.values?.[valueIndex as number];
  if (value == null) {
    return valueIndex instanceof Array
      ? { values: valueIndex }
      : { value: valueIndex.toString() };
  }

  return value;
};
