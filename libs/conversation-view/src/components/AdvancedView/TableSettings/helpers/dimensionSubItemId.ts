const DIMENSION_SUB_ITEM_SEPARATOR = '::';

export function buildDimensionSubItemId(urn: string, dimensionKey: string) {
  return `${urn}${DIMENSION_SUB_ITEM_SEPARATOR}${dimensionKey}`;
}

export function isDimensionSubItemId(id: string) {
  return id.includes(DIMENSION_SUB_ITEM_SEPARATOR);
}

export function parseDimensionSubItemId(id: string) {
  const idx = id.indexOf(DIMENSION_SUB_ITEM_SEPARATOR);
  return {
    urn: id.slice(0, idx),
    dimensionKey: id.slice(idx + DIMENSION_SUB_ITEM_SEPARATOR.length),
  };
}
