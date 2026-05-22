import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatasetSelectorFacet } from '../DatasetSelectorFacet';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

jest.mock('@epam/statgpt-ui-components', () => ({
  IconButton: ({ onClick, title }: any) => (
    <button onClick={onClick} aria-label={title}>
      clear
    </button>
  ),
}));

jest.mock('../../../../../../context/ConversationViewStylesContext', () => ({
  useConversationViewStyles: () => ({ titles: {} }),
}));

jest.mock('../../../../../../assets/icons/clear.svg', () => () => null);

const makeQuery = (urn: string): DataQuery => ({
  urn,
  title: urn,
  metadata: { countryDimension: 'REF_AREA', indicatorDimensions: [] },
});

describe('DatasetSelectorFacet', () => {
  const dataQueries = [makeQuery('A'), makeQuery('B'), makeQuery('C')];

  it('shows enabled/total counter', () => {
    render(
      <DatasetSelectorFacet
        dataQueries={dataQueries}
        disabledDatasetUrns={new Set(['A'])}
        isSelected={false}
        onSelect={jest.fn()}
        onClearAll={jest.fn()}
      />,
    );
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('shows clear icon when at least one dataset is disabled', () => {
    render(
      <DatasetSelectorFacet
        dataQueries={dataQueries}
        disabledDatasetUrns={new Set(['A'])}
        isSelected={false}
        onSelect={jest.fn()}
        onClearAll={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('hides clear icon when no datasets are disabled', () => {
    render(
      <DatasetSelectorFacet
        dataQueries={dataQueries}
        disabledDatasetUrns={new Set()}
        isSelected={false}
        onSelect={jest.fn()}
        onClearAll={jest.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /reset/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onSelect when the row is clicked', () => {
    const onSelect = jest.fn();
    render(
      <DatasetSelectorFacet
        dataQueries={dataQueries}
        disabledDatasetUrns={new Set()}
        isSelected={false}
        onSelect={onSelect}
        onClearAll={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Dataset'));
    expect(onSelect).toHaveBeenCalled();
  });

  it('calls onClearAll when clear icon is clicked without triggering onSelect', () => {
    const onSelect = jest.fn();
    const onClearAll = jest.fn();
    render(
      <DatasetSelectorFacet
        dataQueries={dataQueries}
        disabledDatasetUrns={new Set(['A'])}
        isSelected={false}
        onSelect={onSelect}
        onClearAll={onClearAll}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(onClearAll).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
