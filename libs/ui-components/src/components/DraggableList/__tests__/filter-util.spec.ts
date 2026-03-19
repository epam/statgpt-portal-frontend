import { filterDraggableListNodes } from '../utils/filter-util';
import type { DraggableListNode } from '../types';

describe('filterDraggableListNodes', () => {
  const tree: DraggableListNode[] = [
    {
      type: 'item',
      id: 'agency',
      label: 'Agency',
      isChecked: true,
    },
    {
      type: 'item',
      id: 'indicator-dimensions',
      label: 'Indicator dimensions',
      isChecked: true,
      isExpanded: false,
      items: [
        {
          type: 'group',
          id: 'weo-group',
          label: 'World Economic Outlook (WEO)',
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
              isChecked: true,
            },
            {
              type: 'item',
              id: 'unit-of-measure',
              label: 'Unit of measure',
              isChecked: true,
            },
          ],
        },
        {
          type: 'group',
          id: 'gdp-group',
          label: 'GDP per capita in PPS',
          items: [
            {
              type: 'item',
              id: 'account-indicator',
              label: 'National account indicator',
              isChecked: true,
            },
            {
              type: 'item',
              id: 'seasonal-adjustment',
              label: 'Seasonal adjustment',
              isChecked: true,
            },
          ],
        },
      ],
    },
    {
      type: 'item',
      id: 'frequency',
      label: 'Frequency',
      isChecked: true,
    },
  ];

  it('returns original nodes when query is empty', () => {
    const result = filterDraggableListNodes(tree, '');

    expect(result).toBe(tree);
  });

  it('returns original nodes when query contains only spaces', () => {
    const result = filterDraggableListNodes(tree, '   ');

    expect(result).toBe(tree);
  });

  it('matches labels case-insensitively', () => {
    const result = filterDraggableListNodes(tree, 'agency');

    expect(result).toEqual([
      {
        type: 'item',
        id: 'agency',
        label: 'Agency',
        isChecked: true,
      },
    ]);
  });

  it('trims query before filtering', () => {
    const result = filterDraggableListNodes(tree, '  frequency  ');

    expect(result).toEqual([
      {
        type: 'item',
        id: 'frequency',
        label: 'Frequency',
        isChecked: true,
      },
    ]);
  });

  it('keeps all parents of a matched descendant', () => {
    const result = filterDraggableListNodes(tree, 'seasonal');

    expect(result).toEqual([
      {
        type: 'item',
        id: 'indicator-dimensions',
        label: 'Indicator dimensions',
        isChecked: true,
        isExpanded: true,
        items: [
          {
            type: 'group',
            id: 'gdp-group',
            label: 'GDP per capita in PPS',
            items: [
              {
                type: 'item',
                id: 'seasonal-adjustment',
                label: 'Seasonal adjustment',
                isChecked: true,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('removes unrelated branches', () => {
    const result = filterDraggableListNodes(tree, 'scale');

    expect(result).toEqual([
      {
        type: 'item',
        id: 'indicator-dimensions',
        label: 'Indicator dimensions',
        isChecked: true,
        isExpanded: true,
        items: [
          {
            type: 'group',
            id: 'weo-group',
            label: 'World Economic Outlook (WEO)',
            items: [
              {
                type: 'item',
                id: 'scale',
                label: 'Scale',
                isChecked: true,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('returns empty array when nothing matches', () => {
    const result = filterDraggableListNodes(tree, 'missing-query');

    expect(result).toEqual([]);
  });

  it('expands matched parent item branches by default', () => {
    const result = filterDraggableListNodes(tree, 'indicator');

    const parent = result.find(
      (node) => node.type === 'item' && node.id === 'indicator-dimensions',
    );

    expect(parent).toBeTruthy();
    if (parent?.type === 'item') {
      expect(parent.isExpanded).toBe(true);
    }
  });

  it('does not force expansion when expandMatchedBranches is false', () => {
    const result = filterDraggableListNodes(tree, 'indicator', {
      expandMatchedBranches: false,
    });

    const parent = result.find(
      (node) => node.type === 'item' && node.id === 'indicator-dimensions',
    );

    expect(parent).toBeTruthy();
    if (parent?.type === 'item') {
      expect(parent.isExpanded).toBe(false);
    }
  });

  it('keeps full group subtree when group label matches by default', () => {
    const result = filterDraggableListNodes(tree, 'gdp');

    expect(result).toEqual([
      {
        type: 'item',
        id: 'indicator-dimensions',
        label: 'Indicator dimensions',
        isChecked: true,
        isExpanded: true,
        items: [
          {
            type: 'group',
            id: 'gdp-group',
            label: 'GDP per capita in PPS',
            items: [
              {
                type: 'item',
                id: 'account-indicator',
                label: 'National account indicator',
                isChecked: true,
              },
              {
                type: 'item',
                id: 'seasonal-adjustment',
                label: 'Seasonal adjustment',
                isChecked: true,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('does not keep full group subtree when includeGroupDescendantsOnMatch is false', () => {
    const result = filterDraggableListNodes(tree, 'gdp', {
      includeGroupDescendantsOnMatch: false,
    });

    expect(result).toEqual([
      {
        type: 'item',
        id: 'indicator-dimensions',
        label: 'Indicator dimensions',
        isChecked: true,
        isExpanded: true,
        items: [
          {
            type: 'group',
            id: 'gdp-group',
            label: 'GDP per capita in PPS',
            items: [],
          },
        ],
      },
    ]);
  });

  it('does not keep full item subtree when item matches by default', () => {
    const result = filterDraggableListNodes(tree, 'indicator dimensions');

    expect(result).toEqual([
      {
        type: 'item',
        id: 'indicator-dimensions',
        label: 'Indicator dimensions',
        isChecked: true,
        isExpanded: false,
      },
    ]);
  });

  it('keeps full item subtree when includeItemDescendantsOnMatch is true', () => {
    const result = filterDraggableListNodes(tree, 'indicator dimensions', {
      includeItemDescendantsOnMatch: true,
    });

    expect(result).toEqual([
      {
        type: 'item',
        id: 'indicator-dimensions',
        label: 'Indicator dimensions',
        isChecked: true,
        isExpanded: true,
        items: [
          {
            type: 'group',
            id: 'weo-group',
            label: 'World Economic Outlook (WEO)',
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
                isChecked: true,
              },
              {
                type: 'item',
                id: 'unit-of-measure',
                label: 'Unit of measure',
                isChecked: true,
              },
            ],
          },
          {
            type: 'group',
            id: 'gdp-group',
            label: 'GDP per capita in PPS',
            items: [
              {
                type: 'item',
                id: 'account-indicator',
                label: 'National account indicator',
                isChecked: true,
              },
              {
                type: 'item',
                id: 'seasonal-adjustment',
                label: 'Seasonal adjustment',
                isChecked: true,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('uses custom match function when provided', () => {
    const match = jest.fn((node: DraggableListNode, normalizedQuery: string) =>
      node.id.toLowerCase().includes(normalizedQuery),
    );

    const result = filterDraggableListNodes(tree, 'frequency', { match });

    expect(match).toHaveBeenCalled();
    expect(result).toEqual([
      {
        type: 'item',
        id: 'frequency',
        label: 'Frequency',
        isChecked: true,
      },
    ]);
  });

  it('preserves original tree when empty query instead of cloning', () => {
    const result = filterDraggableListNodes(tree, '');

    expect(result).toBe(tree);
  });
});
