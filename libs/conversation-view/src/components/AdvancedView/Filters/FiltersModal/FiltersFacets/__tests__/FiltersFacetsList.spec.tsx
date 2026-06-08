import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import FiltersFacetsList from '../FiltersFacetsList';

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

const mockUseConversationViewFeatureToggles = jest.fn();

jest.mock(
  '../../../../../../context/ConversationViewFeatureTogglesContext',
  () => ({
    useConversationViewFeatureToggles: (...args: any[]) =>
      mockUseConversationViewFeatureToggles(...args),
  }),
);

jest.mock('../../../../../../assets/icons/clear.svg', () => () => null);

const makeQuery = (urn: string): DataQuery => ({
  urn,
  title: urn,
  metadata: { countryDimension: 'REF_AREA', indicatorDimensions: [] },
});

const renderList = (isCrossDatasetModeOn: boolean) => {
  mockUseConversationViewFeatureToggles.mockReturnValue({
    isCrossDatasetModeOn,
  });

  return render(
    <FiltersFacetsList
      filtersList={[]}
      onSelectFilter={jest.fn()}
      onSelectDatasetFacet={jest.fn()}
      onClearAllDatasets={jest.fn()}
      dataQueries={[makeQuery('A'), makeQuery('B')]}
    />,
  );
};

describe('FiltersFacetsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides Dataset selector facet when cross dataset mode is off', () => {
    renderList(false);

    expect(screen.queryByText('Dataset')).not.toBeInTheDocument();
  });

  it('shows Dataset selector facet when cross dataset mode is on', () => {
    renderList(true);

    expect(screen.getByText('Dataset')).toBeInTheDocument();
  });
});
