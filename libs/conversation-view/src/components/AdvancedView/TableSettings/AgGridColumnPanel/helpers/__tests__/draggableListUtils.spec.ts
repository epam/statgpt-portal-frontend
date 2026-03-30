import type {
  DraggableListItemNode,
  DraggableListNode,
} from '@epam/statgpt-ui-components';
import {
  flattenIncludedLeafIds,
  getItemNodeByPath,
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
