import { DraggableListItem, DraggableListSection, ItemKey } from './types';

export function itemKey(
  sectionId: string,
  parentPath: readonly string[],
  itemId: string,
): ItemKey {
  return `i:${sectionId}:${parentPath.join('/')}:${itemId}`;
}

export function parseItemKey(
  k: string,
): { sectionId: string; parentPath: string[]; itemId: string } | null {
  if (!k.startsWith('i:')) return null;

  const rest = k.slice(2);
  const parts = rest.split(':');
  if (parts.length < 3) return null;

  const sectionId = parts[0];
  const parentPathJoined = parts.slice(1, -1).join(':');
  const itemId = parts[parts.length - 1];

  const parentPath = parentPathJoined
    ? parentPathJoined.split('/').filter(Boolean)
    : [];

  return { sectionId, parentPath, itemId };
}

export function updateItemsAtParent(
  sections: DraggableListSection[],
  sectionId: string,
  parentPath: readonly string[],
  updater: (items: DraggableListItem[]) => DraggableListItem[],
): DraggableListSection[] {
  return sections.map((s) => {
    if (s.id !== sectionId) return s;

    const updateRec = (
      items: DraggableListItem[],
      path: readonly string[],
    ): DraggableListItem[] => {
      if (path.length === 0) return updater(items);

      const [head, ...tail] = path;
      return items.map((it) => {
        if (it.id !== head) return it;
        return {
          ...it,
          items: updateRec(it.items ?? [], tail),
        };
      });
    };

    return { ...s, items: updateRec(s.items, parentPath) };
  });
}

export function getSiblings(
  sections: DraggableListSection[],
  sectionId: string,
  parentPath: readonly string[],
): DraggableListItem[] | null {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return null;

  let items = section.items;
  for (const pid of parentPath) {
    const parent = items.find((x) => x.id === pid);
    if (!parent) return null;
    items = parent.items ?? [];
  }
  return items;
}

export function findItem(
  sections: DraggableListSection[],
  sectionId: string,
  parentPath: readonly string[],
  itemId: string,
): DraggableListItem | null {
  const siblings = getSiblings(sections, sectionId, parentPath);
  if (!siblings) return null;
  return siblings.find((x) => x.id === itemId) ?? null;
}
