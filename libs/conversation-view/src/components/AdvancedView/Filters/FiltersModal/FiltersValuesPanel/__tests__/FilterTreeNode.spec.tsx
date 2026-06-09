import { render, fireEvent } from '@testing-library/react';
import FilterTreeNode from '../FilterTreeNode';
import type { FilterTreeNodeProps } from '../../../../../../models/filters';

const leaf = (
  overrides: Partial<FilterTreeNodeProps> = {},
): FilterTreeNodeProps => ({
  id: 'DUP',
  name: 'dup',
  isSelectedValue: false,
  children: [],
  ...overrides,
});

const noop = jest.fn();

describe('FilterTreeNode', () => {
  it('gives each checkbox a DOM-unique id even when nodes share the same code id', () => {
    const { container } = render(
      <>
        <FilterTreeNode
          node={leaf({ name: 'first', disabled: true })}
          selectFilterValue={noop}
          selectHierarchicalNodes={noop}
        />
        <FilterTreeNode
          node={leaf({ name: 'second' })}
          selectFilterValue={noop}
          selectHierarchicalNodes={noop}
        />
      </>,
    );

    const inputs = container.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(inputs).toHaveLength(2);
    // Unique ids => the label/input association can never bind to the wrong node.
    expect(inputs[0].id).not.toBe(inputs[1].id);

    // Each label points at its own (unique) input.
    const labels = container.querySelectorAll('label');
    expect(labels[0].getAttribute('for')).toBe(inputs[0].id);
    expect(labels[1].getAttribute('for')).toBe(inputs[1].id);
  });

  it('selects by the node code id (not the DOM id) when clicked', () => {
    const selectFilterValue = jest.fn();
    const { getByText } = render(
      <FilterTreeNode
        node={leaf({ name: 'second' })}
        selectFilterValue={selectFilterValue}
        selectHierarchicalNodes={noop}
      />,
    );

    fireEvent.click(getByText('second').closest('label') as HTMLLabelElement);

    expect(selectFilterValue).toHaveBeenCalledWith('DUP', true);
  });
});
