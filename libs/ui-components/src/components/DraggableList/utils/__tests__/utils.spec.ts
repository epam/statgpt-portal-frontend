import {
  itemKey,
  parseItemKey,
  findItemNode,
  getNodesAtPath,
  getSortableItemSiblings,
  updateItemsAtParent,
} from '../utils';
import type { DraggableListNode } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const item = (
  id: string,
  label = id,
  extras: Partial<Omit<Extract<DraggableListNode, { type: 'item' }>, 'id' | 'label' | 'type'>> = {},
): DraggableListNode => ({ type: 'item', id, label, ...extras });

const group = (
  id: string,
  items: DraggableListNode[],
  label = id,
): DraggableListNode => ({ type: 'group', id, label, items });

// ---------------------------------------------------------------------------
// itemKey
// ---------------------------------------------------------------------------

describe('itemKey', () => {
  it('builds a key for a root-level item', () => {
    expect(itemKey([], 'a')).toBe('i:a');
  });

  it('builds a key with a single-segment parent path', () => {
    expect(itemKey(['parent'], 'a')).toBe('i:parent/a');
  });

  it('builds a key with a multi-segment parent path', () => {
    expect(itemKey(['p1', 'p2'], 'a')).toBe('i:p1/p2/a');
  });
});

// ---------------------------------------------------------------------------
// parseItemKey
// ---------------------------------------------------------------------------

describe('parseItemKey', () => {
  it('parses a root-level key', () => {
    expect(parseItemKey('i:a')).toEqual({ parentPath: [], itemId: 'a' });
  });

  it('parses a key with one parent segment', () => {
    expect(parseItemKey('i:parent/a')).toEqual({
      parentPath: ['parent'],
      itemId: 'a',
    });
  });

  it('parses a key with multiple parent segments', () => {
    expect(parseItemKey('i:p1/p2/a')).toEqual({
      parentPath: ['p1', 'p2'],
      itemId: 'a',
    });
  });

  it('returns null for a key that does not start with "i:"', () => {
    expect(parseItemKey('x:a')).toBeNull();
  });

  it('returns null for "i:" with no subsequent parts', () => {
    expect(parseItemKey('i:')).toBeNull();
  });

  it('roundtrips with itemKey', () => {
    const parentPath = ['p1', 'p2'];
    const id = 'leaf';
    expect(parseItemKey(itemKey(parentPath, id))).toEqual({
      parentPath,
      itemId: id,
    });
  });
});

// ---------------------------------------------------------------------------
// getNodesAtPath
// ---------------------------------------------------------------------------

describe('getNodesAtPath', () => {
  const tree: DraggableListNode[] = [
    group('g1', [item('i1'), item('i2')]),
    item('i3'),
  ];

  it('returns root nodes for an empty path', () => {
    expect(getNodesAtPath(tree, [])).toBe(tree);
  });

  it('returns the children of a node at depth 1', () => {
    const result = getNodesAtPath(tree, ['g1']);
    expect(result).toEqual([item('i1'), item('i2')]);
  });

  it('returns null when the head node does not exist', () => {
    expect(getNodesAtPath(tree, ['missing'])).toBeNull();
  });

  it('returns null when traversal hits a node without items', () => {
    expect(getNodesAtPath(tree, ['i3', 'anything'])).toBeNull();
  });

  it('returns null for an empty path through a node without items', () => {
    const treeWithoutItems: DraggableListNode[] = [item('i1')];
    expect(getNodesAtPath(treeWithoutItems, ['i1'])).toBeNull();
  });

  it('returns nested children at depth 2', () => {
    const deep: DraggableListNode[] = [
      group('g1', [group('g2', [item('leaf')])]),
    ];
    expect(getNodesAtPath(deep, ['g1', 'g2'])).toEqual([item('leaf')]);
  });
});

// ---------------------------------------------------------------------------
// getSortableItemSiblings
// ---------------------------------------------------------------------------

describe('getSortableItemSiblings', () => {
  const tree: DraggableListNode[] = [
    group('g1', [item('i1'), group('inner', []), item('i2')]),
    item('i3'),
  ];

  it('returns only item-type nodes at the root level', () => {
    const result = getSortableItemSiblings(tree, []);
    expect(result).toEqual([item('i3')]);
  });

  it('filters out group nodes when mixed with items', () => {
    const result = getSortableItemSiblings(tree, ['g1']);
    expect(result).toEqual([item('i1'), item('i2')]);
  });

  it('returns null when the path does not exist', () => {
    expect(getSortableItemSiblings(tree, ['nonexistent'])).toBeNull();
  });

  it('returns an empty array when the level has no item-type nodes', () => {
    const groupOnly: DraggableListNode[] = [
      group('g', [group('inner', [])]),
    ];
    expect(getSortableItemSiblings(groupOnly, ['g'])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findItemNode
// ---------------------------------------------------------------------------

describe('findItemNode', () => {
  const tree: DraggableListNode[] = [
    group('g1', [item('i1'), item('i2')]),
    item('i3'),
  ];

  it('finds a root-level item', () => {
    expect(findItemNode(tree, [], 'i3')).toEqual(item('i3'));
  });

  it('finds an item nested inside a group', () => {
    expect(findItemNode(tree, ['g1'], 'i1')).toEqual(item('i1'));
  });

  it('returns null when the item id does not exist at that path', () => {
    expect(findItemNode(tree, ['g1'], 'missing')).toBeNull();
  });

  it('returns null when the path does not exist', () => {
    expect(findItemNode(tree, ['missing'], 'i1')).toBeNull();
  });

  it('returns null for a group node id (groups are not item nodes)', () => {
    expect(findItemNode(tree, [], 'g1')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateItemsAtParent
// ---------------------------------------------------------------------------

describe('updateItemsAtParent', () => {
  const makeTree = (): DraggableListNode[] => [
    group('g1', [item('i1'), item('i2')]),
    item('i3'),
  ];

  it('applies the updater to root nodes when the path is empty', () => {
    const tree = makeTree();
    const result = updateItemsAtParent(tree, [], (nodes) =>
      nodes.filter((n) => n.id !== 'i3'),
    );
    expect(result).toEqual([group('g1', [item('i1'), item('i2')])]);
  });

  it('applies the updater to children of the target node', () => {
    const tree = makeTree();
    const result = updateItemsAtParent(tree, ['g1'], (nodes) =>
      nodes.filter((n) => n.id !== 'i1'),
    );
    expect(result).toEqual([group('g1', [item('i2')]), item('i3')]);
  });

  it('does not mutate nodes whose id does not match the head', () => {
    const tree = makeTree();
    const result = updateItemsAtParent(tree, ['g1'], (nodes) => nodes);
    expect(result[1]).toBe(tree[1]); // i3 is the same reference
  });

  it('leaves a node unchanged when it has no items', () => {
    const tree: DraggableListNode[] = [item('i1')];
    const updater = jest.fn((nodes: DraggableListNode[]) => nodes);
    const result = updateItemsAtParent(tree, ['i1'], updater);
    expect(updater).not.toHaveBeenCalled();
    expect(result).toEqual(tree);
  });

  it('applies updater recursively at deeper paths', () => {
    const deep: DraggableListNode[] = [
      group('g1', [group('g2', [item('leaf1'), item('leaf2')])]),
    ];
    const result = updateItemsAtParent(deep, ['g1', 'g2'], (nodes) =>
      nodes.filter((n) => n.id !== 'leaf1'),
    );
    expect(result).toEqual([
      group('g1', [group('g2', [item('leaf2')])]),
    ]);
  });
});
