import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatasetValuesPanel } from '../DatasetValuesPanel';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

jest.mock('@epam/statgpt-ui-components', () => ({
  Checkbox: ({ id, label, checked, disabled, onChange }: any) => (
    <label>
      <input
        type="checkbox"
        data-testid={`checkbox-${id}`}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(id, e.target.checked)}
      />
      {label}
    </label>
  ),
}));

jest.mock('@tabler/icons-react', () => ({
  IconSearch: () => null,
}));

jest.mock('../../../../../../context/ConversationViewStylesContext', () => ({
  useConversationViewStyles: () => ({ titles: {} }),
}));

const makeQuery = (urn: string, title: string): DataQuery => ({
  urn,
  title,
  metadata: { countryDimension: 'REF_AREA', indicatorDimensions: [] },
});

const QUERY_A = makeQuery('urn:A', 'Dataset A');
const QUERY_B = makeQuery('urn:B', 'Dataset B');
const QUERY_C = makeQuery('urn:C', 'Dataset C');

describe('DatasetValuesPanel', () => {
  it('renders a checkbox for each dataset', () => {
    render(
      <DatasetValuesPanel
        dataQueries={[QUERY_A, QUERY_B]}
        disabledDatasetUrns={new Set()}
        onToggleDataset={jest.fn()}
      />,
    );
    expect(screen.getByTestId('checkbox-urn:A')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-urn:B')).toBeInTheDocument();
  });

  it('shows disabled-dataset checkboxes as unchecked', () => {
    render(
      <DatasetValuesPanel
        dataQueries={[QUERY_A, QUERY_B]}
        disabledDatasetUrns={new Set(['urn:B'])}
        onToggleDataset={jest.fn()}
      />,
    );
    expect(screen.getByTestId('checkbox-urn:A')).toBeChecked();
    expect(screen.getByTestId('checkbox-urn:B')).not.toBeChecked();
  });

  it('disables the last remaining enabled checkbox', () => {
    render(
      <DatasetValuesPanel
        dataQueries={[QUERY_A, QUERY_B, QUERY_C]}
        disabledDatasetUrns={new Set(['urn:A', 'urn:B'])}
        onToggleDataset={jest.fn()}
      />,
    );
    expect(screen.getByTestId('checkbox-urn:C')).toBeDisabled();
  });

  it('calls onToggleDataset with (urn, false) when an enabled checkbox is unchecked', () => {
    const onToggleDataset = jest.fn();
    render(
      <DatasetValuesPanel
        dataQueries={[QUERY_A, QUERY_B]}
        disabledDatasetUrns={new Set()}
        onToggleDataset={onToggleDataset}
      />,
    );
    fireEvent.click(screen.getByTestId('checkbox-urn:A'));
    expect(onToggleDataset).toHaveBeenCalledWith('urn:A', false);
  });

  it('filters the list by search query', () => {
    render(
      <DatasetValuesPanel
        dataQueries={[QUERY_A, QUERY_B]}
        disabledDatasetUrns={new Set()}
        onToggleDataset={jest.fn()}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Dataset A' },
    });
    expect(screen.getByTestId('checkbox-urn:A')).toBeInTheDocument();
    expect(screen.queryByTestId('checkbox-urn:B')).not.toBeInTheDocument();
  });
});
