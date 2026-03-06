import {
  findItemNode,
  getNodesAtPath,
  getSortableItemSiblings,
  itemKey,
  parseItemKey,
  updateItemsAtParent,
} from '../utils';
import type { DraggableListNode } from '../types';

describe('draggable-list utils', () => {
  const tree: DraggableListNode[] = [
    {
      type: 'item',
      id: 'agency',
      label: 'Agency',
      isChecked: true,
    },
    {
      type: 'group',
      id: 'indicator-group',
      label: 'Indicator dimensions',
      items: [
        {
          type: 'item',
          id: 'weo',
          label: 'World Economic Outlook (WEO)',
          isExpanded: true,
          items: [
            {
              type: 'item',
              id: 'indicator',
              label: 'Indicator',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'scale',
              label: 'Scale',
              isChecked: false,
            },
          ],
        },
        {
          type: 'item',
          id: 'imf',
          label: 'IMF',
          isChecked: false,
        },
      ],
    },
  ];

  describe('itemKey', () => {
    it('builds key for root item', () => {
      expect(itemKey([], 'agency')).toBe('i:agency');
    });

    it('builds key for nested item', () => {
      expect(itemKey(['indicator-group', 'weo'], 'indicator')).toBe(
        'i:indicator-group/weo/indicator',
      );
    });
  });

  describe('parseItemKey', () => {
    it('returns null for invalid prefix', () => {
      expect(parseItemKey('x:agency')).toBeNull();
    });

    it('returns null for empty payload', () => {
      expect(parseItemKey('i:')).toBeNull();
    });

    it('parses root item key', () => {
      expect(parseItemKey('i:agency')).toEqual({
        parentPath: [],
        itemId: 'agency',
      });
    });

    it('parses nested item key', () => {
      expect(parseItemKey('i:indicator-group/weo/indicator')).toEqual({
        parentPath: ['indicator-group', 'weo'],
        itemId: 'indicator',
      });
    });

    it('round-trips correctly with itemKey', () => {
      const key = itemKey(['indicator-group', 'weo'], 'scale');

      expect(parseItemKey(key)).toEqual({
        parentPath: ['indicator-group', 'weo'],
        itemId: 'scale',
      });
    });
  });

  describe('getNodesAtPath', () => {
    it('returns root nodes for empty path', () => {
      expect(getNodesAtPath(tree, [])).toBe(tree);
    });

    it('returns child nodes for valid path', () => {
      const result = getNodesAtPath(tree, ['indicator-group']);

      expect(result).toEqual([
        {
          type: 'item',
          id: 'weo',
          label: 'World Economic Outlook (WEO)',
          isExpanded: true,
          items: [
            {
              type: 'item',
              id: 'indicator',
              label: 'Indicator',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'scale',
              label: 'Scale',
              isChecked: false,
            },
          ],
        },
        {
          type: 'item',
          id: 'imf',
          label: 'IMF',
          isChecked: false,
        },
      ]);
    });

    it('returns deeply nested nodes for valid deep path', () => {
      const result = getNodesAtPath(tree, ['indicator-group', 'weo']);

      expect(result).toEqual([
        {
          type: 'item',
          id: 'indicator',
          label: 'Indicator',
          isChecked: true,
        },
        {
          type: 'item',
          id: 'scale',
          label: 'Scale',
          isChecked: false,
        },
      ]);
    });

    it('returns null for unknown path', () => {
      expect(getNodesAtPath(tree, ['unknown'])).toBeNull();
    });

    it('returns null when path points to node without items', () => {
      expect(getNodesAtPath(tree, ['agency'])).toBeNull();
    });
  });

  describe('getSortableItemSiblings', () => {
    it('returns only item nodes at root level', () => {
      const result = getSortableItemSiblings(tree, []);

      expect(result).toEqual([
        {
          type: 'item',
          id: 'agency',
          label: 'Agency',
          isChecked: true,
        },
      ]);
    });

    it('returns item siblings inside nested group', () => {
      const result = getSortableItemSiblings(tree, ['indicator-group']);

      expect(result).toEqual([
        {
          type: 'item',
          id: 'weo',
          label: 'World Economic Outlook (WEO)',
          isExpanded: true,
          items: [
            {
              type: 'item',
              id: 'indicator',
              label: 'Indicator',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'scale',
              label: 'Scale',
              isChecked: false,
            },
          ],
        },
        {
          type: 'item',
          id: 'imf',
          label: 'IMF',
          isChecked: false,
        },
      ]);
    });

    it('returns null for invalid parent path', () => {
      expect(getSortableItemSiblings(tree, ['missing'])).toBeNull();
    });
  });

  describe('findItemNode', () => {
    it('finds root item node', () => {
      expect(findItemNode(tree, [], 'agency')).toEqual({
        type: 'item',
        id: 'agency',
        label: 'Agency',
        isChecked: true,
      });
    });

    it('finds nested item node', () => {
      expect(findItemNode(tree, ['indicator-group', 'weo'], 'scale')).toEqual({
        type: 'item',
        id: 'scale',
        label: 'Scale',
        isChecked: false,
      });
    });

    it('returns null for unknown item id', () => {
      expect(findItemNode(tree, ['indicator-group'], 'missing')).toBeNull();
    });

    it('returns null for invalid parent path', () => {
      expect(findItemNode(tree, ['missing'], 'scale')).toBeNull();
    });
  });

  describe('updateItemsAtParent', () => {
    it('updates root nodes when parentPath is empty', () => {
      const next = updateItemsAtParent(
        tree,
        [],
        (nodes: DraggableListNode[]) => [
          ...nodes,
          {
            type: 'item',
            id: 'dataset',
            label: 'Dataset',
            isChecked: true,
          },
        ],
      );

      expect(next).toHaveLength(3);
      expect(next[2]).toEqual({
        type: 'item',
        id: 'dataset',
        label: 'Dataset',
        isChecked: true,
      });
      expect(tree).toHaveLength(2);
    });

    it('updates nested child collection at given parent path', () => {
      const next = updateItemsAtParent(
        tree,
        ['indicator-group', 'weo'],
        (nodes: DraggableListNode[]) =>
          nodes.map((node) =>
            node.id === 'scale' && node.type === 'item'
              ? { ...node, isChecked: true }
              : node,
          ),
      );

      const updated = getNodesAtPath(next, ['indicator-group', 'weo']);
      expect(updated).toEqual([
        {
          type: 'item',
          id: 'indicator',
          label: 'Indicator',
          isChecked: true,
        },
        {
          type: 'item',
          id: 'scale',
          label: 'Scale',
          isChecked: true,
        },
      ]);
    });

    it('does not mutate untouched branches', () => {
      const next = updateItemsAtParent(
        tree,
        ['indicator-group', 'weo'],
        (nodes: DraggableListNode[]) =>
          nodes.map((node) =>
            node.id === 'indicator' && node.type === 'item'
              ? { ...node, isChecked: false }
              : node,
          ),
      );

      expect(next).not.toBe(tree);
      expect(next[0]).toBe(tree[0]);
    });

    it('returns original structure when path does not exist', () => {
      const next = updateItemsAtParent(
        tree,
        ['missing'],
        (nodes: DraggableListNode[]) => nodes.slice(),
      );

      expect(next).toEqual(tree);
    });

    it('returns original node when matched path node has no items', () => {
      const next = updateItemsAtParent(
        tree,
        ['agency'],
        (nodes: DraggableListNode[]) => nodes.slice(),
      );

      expect(next).toEqual(tree);
    });
  });
});
