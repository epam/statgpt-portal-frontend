import { filterDraggableListNodes } from '../filter-util';
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
// Empty / blank queries — return original nodes
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — empty/blank query', () => {
  const nodes: DraggableListNode[] = [item('a'), item('b')];

  it('returns the original array when query is empty string', () => {
    expect(filterDraggableListNodes(nodes, '')).toBe(nodes);
  });

  it('returns the original array when query is only whitespace', () => {
    expect(filterDraggableListNodes(nodes, '   ')).toBe(nodes);
  });
});

// ---------------------------------------------------------------------------
// No match
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — no match', () => {
  it('returns an empty array when no nodes match', () => {
    const nodes: DraggableListNode[] = [item('a', 'Alpha'), item('b', 'Beta')];
    expect(filterDraggableListNodes(nodes, 'zzz')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Case-insensitive matching
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — case insensitivity', () => {
  const nodes: DraggableListNode[] = [item('a', 'Hello World')];

  it('matches lowercase query against uppercase label', () => {
    expect(filterDraggableListNodes(nodes, 'hello')).toEqual([item('a', 'Hello World')]);
  });

  it('matches uppercase query against lowercase label', () => {
    expect(filterDraggableListNodes(nodes, 'HELLO')).toEqual([item('a', 'Hello World')]);
  });

  it('trims leading and trailing whitespace from the query', () => {
    expect(filterDraggableListNodes(nodes, '  hello  ')).toEqual([item('a', 'Hello World')]);
  });
});

// ---------------------------------------------------------------------------
// Flat list — item matching
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — flat item list', () => {
  const nodes: DraggableListNode[] = [
    item('a', 'Alpha'),
    item('b', 'Beta'),
    item('c', 'Gamma'),
  ];

  it('returns only matching items', () => {
    expect(filterDraggableListNodes(nodes, 'al')).toEqual([item('a', 'Alpha')]);
  });

  it('returns multiple matching items — "a" is in Alpha, Beta, and Gamma', () => {
    const result = filterDraggableListNodes(nodes, 'a');
    expect(result).toEqual([item('a', 'Alpha'), item('b', 'Beta'), item('c', 'Gamma')]);
  });
});

// ---------------------------------------------------------------------------
// Group with matching group label (default: includeGroupDescendantsOnMatch=true)
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — matching group keeps full subtree by default', () => {
  const nodes: DraggableListNode[] = [
    group('g', [item('i1', 'Child1'), item('i2', 'Child2')], 'MyGroup'),
    item('other', 'Other'),
  ];

  it('includes all group children when the group label matches', () => {
    const result = filterDraggableListNodes(nodes, 'mygroup');
    expect(result).toEqual([
      group('g', [item('i1', 'Child1'), item('i2', 'Child2')], 'MyGroup'),
    ]);
  });
});

// ---------------------------------------------------------------------------
// Group with matching group label — includeGroupDescendantsOnMatch=false
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — includeGroupDescendantsOnMatch=false', () => {
  const nodes: DraggableListNode[] = [
    group(
      'g',
      [item('i1', 'MatchMe'), item('i2', 'NoMatch')],
      'MyGroup',
    ),
  ];

  it('filters group children rather than keeping all when group matches', () => {
    const result = filterDraggableListNodes(nodes, 'mygroup', {
      includeGroupDescendantsOnMatch: false,
    });
    // group matches but no child matches "mygroup" → children list is empty
    expect(result).toEqual([group('g', [], 'MyGroup')]);
  });
});

// ---------------------------------------------------------------------------
// Item with children — includeItemDescendantsOnMatch (default: false)
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — item with children', () => {
  const nodes: DraggableListNode[] = [
    item('parent', 'Parent', {
      items: [item('child1', 'Child1'), item('child2', 'Child2')],
    }),
  ];

  it('returns matching item without its children by default (includeItemDescendantsOnMatch=false)', () => {
    const result = filterDraggableListNodes(nodes, 'parent');
    // selfMatches=true, includeItemDescendantsOnMatch=false
    // → nextNode built without items (no descendants matched)
    const expected = item('parent', 'Parent'); // no items key
    expect(result).toEqual([expected]);
  });

  it('returns matching item with its full subtree when includeItemDescendantsOnMatch=true', () => {
    const result = filterDraggableListNodes(nodes, 'parent', {
      includeItemDescendantsOnMatch: true,
    });
    // expandTree spreads all node fields; leaf items get isExpanded/items as explicit undefined,
    // and the parent with children gets isExpanded:true (expandMatchedBranches defaults to true).
    expect(result).toEqual([
      {
        type: 'item',
        id: 'parent',
        label: 'Parent',
        isExpanded: true,
        items: [
          { type: 'item', id: 'child1', label: 'Child1', isExpanded: undefined, items: undefined },
          { type: 'item', id: 'child2', label: 'Child2', isExpanded: undefined, items: undefined },
        ],
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Ancestor included when descendant matches
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — ancestor inclusion', () => {
  const nodes: DraggableListNode[] = [
    item('parent', 'Parent', {
      isExpanded: false,
      items: [item('child', 'SpecificChild'), item('other', 'Other')],
    }),
  ];

  it('includes the parent item when a descendant matches', () => {
    const result = filterDraggableListNodes(nodes, 'specificchild');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('parent');
  });

  it('includes only the matching descendant, not non-matching siblings', () => {
    const result = filterDraggableListNodes(nodes, 'specificchild') as Extract<
      DraggableListNode,
      { type: 'item' }
    >[];
    expect(result[0].items).toEqual([item('child', 'SpecificChild')]);
  });
});

// ---------------------------------------------------------------------------
// expandMatchedBranches (default: true)
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — expandMatchedBranches', () => {
  const nodes: DraggableListNode[] = [
    item('parent', 'Parent', {
      isExpanded: false,
      items: [item('child', 'MatchMe')],
    }),
  ];

  it('sets isExpanded=true on the parent when a child matches (expandMatchedBranches=true by default)', () => {
    const result = filterDraggableListNodes(nodes, 'matchme') as Extract<
      DraggableListNode,
      { type: 'item' }
    >[];
    expect(result[0].isExpanded).toBe(true);
  });

  it('does not set isExpanded on the parent when expandMatchedBranches=false', () => {
    const result = filterDraggableListNodes(nodes, 'matchme', {
      expandMatchedBranches: false,
    }) as Extract<DraggableListNode, { type: 'item' }>[];
    expect(result[0].isExpanded).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Custom match function
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — custom match', () => {
  const nodes: DraggableListNode[] = [
    item('a', 'Alpha'),
    item('b', 'Beta'),
  ];

  it('uses the provided match function instead of the default label match', () => {
    const matchById = (node: DraggableListNode) => node.id === 'b';
    const result = filterDraggableListNodes(nodes, 'anything', {
      match: matchById,
    });
    expect(result).toEqual([item('b', 'Beta')]);
  });

  it('passes the normalized (trimmed + lowercased) query to the custom match', () => {
    const capturedQueries: string[] = [];
    filterDraggableListNodes(nodes, '  HELLO  ', {
      match: (node, q) => {
        capturedQueries.push(q);
        return false;
      },
    });
    expect(capturedQueries.every((q) => q === 'hello')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Deep / nested trees
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — deep nested tree', () => {
  const tree: DraggableListNode[] = [
    group('g1', [
      item('i1', 'Alpha'),
      group('g2', [
        item('i2', 'Beta'),
        item('i3', 'DeepMatch'),
      ]),
    ]),
    item('i4', 'Gamma'),
  ];

  it('propagates a match from a deeply nested item up through all ancestors', () => {
    const result = filterDraggableListNodes(tree, 'deepmatch');
    expect(result).toEqual([
      group('g1', [
        group('g2', [item('i3', 'DeepMatch')]),
      ]),
    ]);
  });

  it('returns multiple branches when items in different branches match', () => {
    const result = filterDraggableListNodes(tree, 'a'); // alpha, gamma both contain 'a'
    expect(result.map((n) => n.id)).toEqual(expect.arrayContaining(['g1', 'i4']));
  });
});

// ---------------------------------------------------------------------------
// Group with no matching descendants and not self-matching
// ---------------------------------------------------------------------------

describe('filterDraggableListNodes — group fully excluded', () => {
  it('excludes a group entirely when it does not match and has no matching children', () => {
    const nodes: DraggableListNode[] = [
      group('g', [item('i', 'Nope')], 'Also Nope'),
      item('match', 'Yes'),
    ];
    const result = filterDraggableListNodes(nodes, 'yes');
    expect(result).toEqual([item('match', 'Yes')]);
  });
});
