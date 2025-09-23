import { DimensionValue, StructureAttribute } from '../models/data/structure';
import { AttributeIndexValue } from '../types/attribute-index-value';

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
