const DIMENSION_SUB_ITEM_SEPARATOR = '::';

/**
 * Builds a composite sub-item identifier by joining a URN and a dimension key with a separator.
 *
 * @param urn - The URN of the parent dimension item.
 * @param dimensionKey - The key that identifies the specific sub-item within the dimension.
 * @returns A string combining the URN and dimension key, suitable for use as a unique sub-item ID.
 */
export function buildDimensionSubItemId(urn: string, dimensionKey: string) {
  return `${urn}${DIMENSION_SUB_ITEM_SEPARATOR}${dimensionKey}`;
}

/**
 * Returns whether the given ID was produced by `buildDimensionSubItemId` and encodes a sub-item.
 *
 * @param id - The ID string to test.
 * @returns `true` when the ID contains the sub-item separator, `false` otherwise.
 */
export function isDimensionSubItemId(id: string) {
  return id.includes(DIMENSION_SUB_ITEM_SEPARATOR);
}

/**
 * Splits a composite sub-item ID created by `buildDimensionSubItemId` back into its parts.
 *
 * @param id - A sub-item ID previously produced by `buildDimensionSubItemId`.
 * @returns An object containing the original `urn` and `dimensionKey` encoded in the ID.
 */
export function parseDimensionSubItemId(id: string) {
  const idx = id.indexOf(DIMENSION_SUB_ITEM_SEPARATOR);
  return {
    urn: id.slice(0, idx),
    dimensionKey: id.slice(idx + DIMENSION_SUB_ITEM_SEPARATOR.length),
  };
}
