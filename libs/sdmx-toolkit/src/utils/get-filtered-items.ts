const setItemWithParent = <T extends { id: string; parent?: string }>(
  item?: T,
  filteredItemsMap?: Map<string, T>,
  itemsMap?: Map<string, T>,
) => {
  if (!item || filteredItemsMap?.has(item?.id)) {
    return;
  }

  filteredItemsMap?.set(item?.id, item);

  if (item?.parent) {
    const parentItem = itemsMap?.get(item?.parent);
    setItemWithParent(parentItem, filteredItemsMap, itemsMap);
  }
};

export const getFilteredItemsWithParents = <
  T extends { id: string; parent?: string },
>(
  items?: T[],
  filteredItems?: T[],
) => {
  const filteredItemsMap = new Map<string, T>();
  const itemsMap = new Map<string, T>(items?.map((item) => [item.id, item]));

  filteredItems?.forEach((filteredItem) => {
    setItemWithParent(filteredItem, filteredItemsMap, itemsMap);
  });

  return Array.from(filteredItemsMap?.values());
};
