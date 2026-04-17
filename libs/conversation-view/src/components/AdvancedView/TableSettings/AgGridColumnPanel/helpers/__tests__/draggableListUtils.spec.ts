import type {
  DraggableListItemNode,
  DraggableListNode,
} from '@epam/statgpt-ui-components';
import {
  flattenIncludedLeafIds,
  getItemNodeByPath,
  protectLastVisibleLeafInGroups,
} from '../draggableListUtils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function item(
  id: string,
  children?: DraggableListNode[],
): DraggableListItemNode {
  return { type: 'item', id, label: id, items: children };
}

function checkedItem(
  id: string,
  isChecked: boolean,
  extra?: Partial<DraggableListItemNode>,
): DraggableListItemNode {
  return { type: 'item', id, label: id, isChecked, ...extra };
}

function group(id: string, children: DraggableListNode[]): DraggableListNode {
  return { type: 'group', id, label: id, items: children };
}

// ---------------------------------------------------------------------------
// flattenIncludedLeafIds
// ---------------------------------------------------------------------------

describe('flattenIncludedLeafIds', () => {
  describe('without isLeaf predicate', () => {
    it('collects all flat items', () => {
      const nodes: DraggableListNode[] = [item('a'), item('b'), item('c')];
      expect(flattenIncludedLeafIds(nodes)).toEqual(['a', 'b', 'c']);
    });

    it('collects leaf children of an item that has nested items (does not collect the parent)', () => {
      const nodes: DraggableListNode[] = [
        item('parent', [item('child1'), item('child2')]),
      ];
      expect(flattenIncludedLeafIds(nodes)).toEqual(['child1', 'child2']);
    });

    it('recurses into group nodes and collects their item leaves', () => {
      const nodes: DraggableListNode[] = [group('g1', [item('a'), item('b')])];
      expect(flattenIncludedLeafIds(nodes)).toEqual(['a', 'b']);
    });

    it('handles mixed flat items and nested items together', () => {
      const nodes: DraggableListNode[] = [
        item('flat1'),
        item('parent', [item('child1'), item('child2')]),
        item('flat2'),
      ];
      expect(flattenIncludedLeafIds(nodes)).toEqual([
        'flat1',
        'child1',
        'child2',
        'flat2',
      ]);
    });

    it('recurses deeply through multiple nesting levels', () => {
      const nodes: DraggableListNode[] = [
        item('l1', [item('l2', [item('l3')])]),
      ];
      expect(flattenIncludedLeafIds(nodes)).toEqual(['l3']);
    });

    it('returns empty array for empty input', () => {
      expect(flattenIncludedLeafIds([])).toEqual([]);
    });
  });

  describe('with isLeaf predicate', () => {
    it('collects items matching isLeaf immediately, skipping their children', () => {
      const nodes: DraggableListNode[] = [
        item('parent', [item('child1'), item('child2')]),
      ];
      const isLeaf = (n: DraggableListItemNode) => n.id === 'parent';
      expect(flattenIncludedLeafIds(nodes, isLeaf)).toEqual(['parent']);
    });

    it('falls through to collect children when isLeaf returns false and node has children', () => {
      const nodes: DraggableListNode[] = [
        item('parent', [item('child1'), item('child2')]),
      ];
      const isLeaf = () => false;
      expect(flattenIncludedLeafIds(nodes, isLeaf)).toEqual([
        'child1',
        'child2',
      ]);
    });

    it('falls through to collect bare item when isLeaf returns false and node has no children', () => {
      const nodes: DraggableListNode[] = [item('a'), item('b')];
      const isLeaf = () => false;
      expect(flattenIncludedLeafIds(nodes, isLeaf)).toEqual(['a', 'b']);
    });

    it('always recurses into group nodes regardless of isLeaf', () => {
      const nodes: DraggableListNode[] = [group('g1', [item('a'), item('b')])];
      const isLeaf = (n: DraggableListItemNode) => n.id === 'a';
      expect(flattenIncludedLeafIds(nodes, isLeaf)).toEqual(['a', 'b']);
    });

    it('collects isLeaf items early and still collects childless items for which isLeaf returns false', () => {
      // 'x' — isLeaf → collected immediately
      // 'y' — isLeaf → collected immediately (children y1, y2 are NOT traversed)
      // 'z' — isLeaf returns false, no children → falls through to the bare-item branch
      const nodes: DraggableListNode[] = [
        item('x'),
        item('y', [item('y1'), item('y2')]),
        item('z'),
      ];
      const isLeaf = (n: DraggableListItemNode) => n.id === 'x' || n.id === 'y';
      expect(flattenIncludedLeafIds(nodes, isLeaf)).toEqual(['x', 'y', 'z']);
    });
  });
});

// ---------------------------------------------------------------------------
// getItemNodeByPath
// ---------------------------------------------------------------------------

describe('getItemNodeByPath', () => {
  it('returns a root-level item for a single-element path', () => {
    const nodes: DraggableListNode[] = [item('a'), item('b')];
    expect(getItemNodeByPath(nodes, ['b'])).toMatchObject({ id: 'b' });
  });

  it('returns a nested item following a two-element path', () => {
    const child = item('child');
    const nodes: DraggableListNode[] = [item('parent', [child])];
    expect(getItemNodeByPath(nodes, ['parent', 'child'])).toBe(child);
  });

  it('returns undefined when an id in the path does not exist', () => {
    const nodes: DraggableListNode[] = [item('a')];
    expect(getItemNodeByPath(nodes, ['nonexistent'])).toBeUndefined();
  });

  it('returns undefined when an intermediate id does not exist', () => {
    const nodes: DraggableListNode[] = [item('a', [item('b')])];
    expect(getItemNodeByPath(nodes, ['a', 'missing'])).toBeUndefined();
  });

  it('returns undefined when the path terminates on a group node', () => {
    const nodes: DraggableListNode[] = [group('g1', [item('child')])];
    expect(getItemNodeByPath(nodes, ['g1'])).toBeUndefined();
  });

  it('navigates through a group node in the middle of the path', () => {
    const child = item('leaf');
    const nodes: DraggableListNode[] = [item('top', [group('g1', [child])])];
    expect(getItemNodeByPath(nodes, ['top', 'g1', 'leaf'])).toBe(child);
  });

  it('returns undefined for an empty path', () => {
    const nodes: DraggableListNode[] = [item('a')];
    expect(getItemNodeByPath(nodes, [])).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// protectLastVisibleLeafInGroups
// ---------------------------------------------------------------------------

describe('protectLastVisibleLeafInGroups', () => {
  describe('no-op cases', () => {
    it('returns the same reference when the item has no sub-items', () => {
      const node = item('col');
      expect(protectLastVisibleLeafInGroups(node)).toBe(node);
    });

    it('returns the same reference when items array is empty', () => {
      const node: DraggableListItemNode = {
        type: 'item',
        id: 'col',
        label: 'col',
        items: [],
      };
      expect(protectLastVisibleLeafInGroups(node)).toBe(node);
    });

    it('returns unchanged when sub-items contain only item nodes (no groups)', () => {
      const node = item('col', [
        checkedItem('a', true),
        checkedItem('b', false),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      expect(result).toBe(node);
    });

    it('returns unchanged when a group has two or more visible leaves', () => {
      const node = item('col', [
        group('g1', [checkedItem('a', true), checkedItem('b', true)]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      expect(result.items![0]).toBe(node.items![0]);
    });

    it('does not force draggable: false when a group has two or more visible leaves', () => {
      const node = item('col', [
        group('g1', [
          checkedItem('a', true, { draggable: true }),
          checkedItem('b', true, { draggable: true }),
        ]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      const leaves = (result.items![0] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];
      expect(leaves.find((l) => l.id === 'a')?.draggable).toBe(true);
      expect(leaves.find((l) => l.id === 'b')?.draggable).toBe(true);
    });

    it('returns unchanged when a group has zero visible leaves', () => {
      const node = item('col', [
        group('g1', [checkedItem('a', false), checkedItem('b', false)]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      expect(result.items![0]).toBe(node.items![0]);
    });
  });

  describe('protection applied', () => {
    it('sets checkable: false on the sole visible leaf in a group', () => {
      const node = item('col', [
        group('g1', [
          checkedItem('a', false),
          checkedItem('b', true),
          checkedItem('c', false),
        ]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      const leaves = (result.items![0] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];
      expect(leaves.find((l) => l.id === 'b')?.checkable).toBe(false);
    });

    it('does not set checkable: false on hidden leaves', () => {
      const node = item('col', [
        group('g1', [
          checkedItem('a', false),
          checkedItem('b', true),
          checkedItem('c', false),
        ]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      const leaves = (result.items![0] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];
      expect(leaves.find((l) => l.id === 'a')?.checkable).toBeUndefined();
      expect(leaves.find((l) => l.id === 'c')?.checkable).toBeUndefined();
    });

    it('treats a leaf with isChecked: undefined as visible', () => {
      const node = item('col', [
        group('g1', [
          checkedItem('a', false),
          item('b'), // isChecked: undefined — treated as visible
        ]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      const leaves = (result.items![0] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];
      expect(leaves.find((l) => l.id === 'b')?.checkable).toBe(false);
    });

    it('sets draggable: false on all leaves in a group when only one leaf is visible', () => {
      const node = item('col', [
        group('g1', [
          checkedItem('a', false, { draggable: true }),
          checkedItem('b', true, { draggable: true }),
          checkedItem('c', false, { draggable: true }),
        ]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      const leaves = (result.items![0] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];
      expect(leaves.find((l) => l.id === 'a')?.draggable).toBe(false);
      expect(leaves.find((l) => l.id === 'b')?.draggable).toBe(false);
      expect(leaves.find((l) => l.id === 'c')?.draggable).toBe(false);
    });

    it('preserves all other fields on the protected leaf', () => {
      const node = item('col', [
        group('g1', [
          checkedItem('a', false),
          checkedItem('b', true, { draggable: true, label: 'Leaf B' }),
        ]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      const leaves = (result.items![0] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];
      const protectedLeaf = leaves.find((l) => l.id === 'b');
      expect(protectedLeaf).toMatchObject({
        id: 'b',
        label: 'Leaf B',
        isChecked: true,
        draggable: false,
        checkable: false,
      });
    });

    it('applies protection to a single-item group (1 total, 1 visible)', () => {
      const node = item('col', [group('g1', [checkedItem('a', true)])]);
      const result = protectLastVisibleLeafInGroups(node);
      const leaves = (result.items![0] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];
      expect(leaves[0].checkable).toBe(false);
    });
  });

  describe('multiple groups', () => {
    it('protects only the group that has exactly one visible leaf', () => {
      const node = item('col', [
        group('g1', [
          checkedItem('a', true, { draggable: true }),
          checkedItem('b', true, { draggable: true }),
        ]),
        group('g2', [
          checkedItem('c', false, { draggable: true }),
          checkedItem('d', true, { draggable: true }),
        ]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      const g1Leaves = (result.items![0] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];
      const g2Leaves = (result.items![1] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];

      // g1 has 2 visible → unchanged
      expect(result.items![0]).toBe(node.items![0]);
      // g2 has 1 visible → protected
      expect(g2Leaves.find((l) => l.id === 'd')?.checkable).toBe(false);
      expect(g1Leaves.find((l) => l.id === 'a')?.draggable).toBe(true);
      expect(g1Leaves.find((l) => l.id === 'b')?.draggable).toBe(true);
      expect(g2Leaves.find((l) => l.id === 'c')?.draggable).toBe(false);
      expect(g2Leaves.find((l) => l.id === 'd')?.draggable).toBe(false);
    });

    it('protects the last visible leaf in each group independently', () => {
      const node = item('col', [
        group('g1', [checkedItem('a', false), checkedItem('b', true)]),
        group('g2', [checkedItem('c', true), checkedItem('d', false)]),
      ]);
      const result = protectLastVisibleLeafInGroups(node);
      const g1Leaves = (result.items![0] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];
      const g2Leaves = (result.items![1] as ReturnType<typeof group>)
        .items as DraggableListItemNode[];

      expect(g1Leaves.find((l) => l.id === 'b')?.checkable).toBe(false);
      expect(g2Leaves.find((l) => l.id === 'c')?.checkable).toBe(false);
      expect(g1Leaves.find((l) => l.id === 'b')?.draggable).toBe(false);
      expect(g2Leaves.find((l) => l.id === 'c')?.draggable).toBe(false);
    });
  });

  describe('immutability', () => {
    it('returns a new item object when protection is applied', () => {
      const node = item('col', [
        group('g1', [checkedItem('a', false), checkedItem('b', true)]),
      ]);
      expect(protectLastVisibleLeafInGroups(node)).not.toBe(node);
    });

    it('does not mutate the original node when protection is applied', () => {
      const leaf = checkedItem('b', true);
      const node = item('col', [group('g1', [checkedItem('a', false), leaf])]);
      protectLastVisibleLeafInGroups(node);
      expect(leaf.checkable).toBeUndefined();
    });

    it('returns the same group reference when no protection is needed', () => {
      const g = group('g1', [checkedItem('a', true), checkedItem('b', true)]);
      const node = item('col', [g]);
      const result = protectLastVisibleLeafInGroups(node);
      expect(result.items![0]).toBe(g);
    });
  });
});
