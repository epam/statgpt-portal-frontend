import { act, render } from '@testing-library/react';
import { createElement } from 'react';
import Filters from '../Filters';
import type {
  DataConstraints,
  DatasetQueryFilters,
} from '@epam/statgpt-sdmx-toolkit';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';
import type { Filter, FiltersProps } from '../../../../models/filters';
import type { FilterSettingsController } from '../FiltersModal/FilterSettingsControllerContext';

const DATASET_URN = 'AGENCY:DF_TEST(1.0)';
const UPDATED_CONSTRAINTS = [
  { id: 'updated-constraints' },
] as DataConstraints[];
const SYSTEM_MESSAGES = [{ id: 'system-message' }];
const UPDATED_DATA_QUERIES = [{ urn: DATASET_URN, filters: [] }] as DataQuery[];

const mockCallbacks: {
  setModalState: ((state: string) => void) | null;
  selectedFiltersCount: number | null;
  controller: FilterSettingsController | null;
  onApply: (() => void) | null;
  onClose: (() => void) | null;
  onClearAllFilters: (() => void) | null;
  applyDisabled: boolean | undefined;
} = {
  setModalState: null,
  selectedFiltersCount: null,
  controller: null,
  onApply: null,
  onClose: null,
  onClearAllFilters: null,
  applyDisabled: undefined,
};

const mockGetSingleDatasetFiltersPreselectedByDataQuery = jest.fn();
const mockGetSingleDatasetConstraintsRequest = jest.fn();
const mockGetCodelistUrnForDatasetFilter = jest.fn(() => undefined);
const mockGetFilledFilters = jest.fn();
const mockCleanIncompatibleFilters = jest.fn();
const mockGetQueryFilters = jest.fn();
const mockSetDataQueryFilters = jest.fn();
const mockUpdateMessagesWithSystemMessage = jest.fn();
const mockGetUpdatedDataQueries = jest.fn();

jest.mock('@epam/ai-dial-shared', () => ({}));

jest.mock('@epam/statgpt-ui-components', () => {
  const R = require('react');
  return {
    Popup: (props: any) =>
      R.createElement('div', { 'data-testid': 'popup' }, props.children),
    PopUpSize: { LG: 'LG' },
    PopUpState: { Opened: 'opened', Closed: 'closed' },
    TREE_NODE_PADDING: 24,
    TREE_NODE_ARROW_SIZE: 24,
    LimitMessages: {},
  };
});

jest.mock('../FilterButton/FilterButton', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: (props: any) => {
      mockCallbacks.setModalState = props.setModalState;
      mockCallbacks.selectedFiltersCount = props.selectedFiltersCount;
      return R.createElement('button', {
        'data-testid': 'filter-button',
        onClick: () => props.setModalState('opened'),
      });
    },
  };
});

jest.mock('../FiltersModal/FiltersSettings', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: (props: any) => {
      mockCallbacks.controller = props.controller;
      return R.createElement('div', { 'data-testid': 'filter-settings' });
    },
  };
});

jest.mock('../FiltersModal/ModalFooter', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: (props: any) => {
      mockCallbacks.onApply = props.onApply;
      mockCallbacks.onClose = props.onClose;
      mockCallbacks.onClearAllFilters = props.onClearAllFilters;
      mockCallbacks.applyDisabled = props.applyDisabled;
      return R.createElement('button', {
        'data-testid': 'apply-button',
        onClick: props.onApply,
      });
    },
  };
});

jest.mock('../../../../context/ConversationViewStylesContext', () => ({
  useConversationViewStyles: jest.fn(() => ({
    titles: {
      close: 'Close',
      settings: 'Settings',
    },
  })),
}));

jest.mock('../../../../context/FiltersModalStateContext', () => {
  const R = require('react');
  return {
    FiltersModalStateProvider: ({ children }: any) => children,
    useFiltersModalState: () => {
      const [modalState, setModalState] = R.useState('closed');
      const [isModalClosed, setIsModalClosed] = R.useState(false);
      return { modalState, setModalState, isModalClosed, setIsModalClosed };
    },
  };
});

jest.mock('../../../../utils/single-dataset-filters', () => ({
  getSingleDatasetFiltersPreselectedByDataQuery: (...args: any[]) =>
    mockGetSingleDatasetFiltersPreselectedByDataQuery(...args),
  getSingleDatasetConstraintsRequest: (...args: any[]) =>
    mockGetSingleDatasetConstraintsRequest(...args),
  getCodelistUrnForDatasetFilter: (...args: any[]) =>
    mockGetCodelistUrnForDatasetFilter(...args),
}));

jest.mock('../../../../utils/get-filled-filters', () => ({
  getFilledFilters: (...args: any[]) => mockGetFilledFilters(...args),
}));

jest.mock('../../../../utils/incompatible-filters', () => ({
  cleanIncompatibleFilters: (...args: any[]) =>
    mockCleanIncompatibleFilters(...args),
}));

jest.mock('../../../../utils/query-filters', () => ({
  getQueryFilters: (...args: any[]) => mockGetQueryFilters(...args),
  setDataQueryFilters: (...args: any[]) => mockSetDataQueryFilters(...args),
}));

jest.mock('../../../../utils/system-message', () => ({
  updateMessagesWithSystemMessage: (...args: any[]) =>
    mockUpdateMessagesWithSystemMessage(...args),
}));

jest.mock('../../../../utils/get-updated-data-queries', () => ({
  getUpdatedDataQueries: (...args: any[]) => mockGetUpdatedDataQueries(...args),
}));

const cloneFilters = (filters: Filter[]): Filter[] =>
  filters.map((filter) => ({
    ...filter,
    dimensionValues: filter.dimensionValues?.map((value) => ({ ...value })),
  }));

const makeInitialFilters = (): Filter[] => [
  {
    id: 'COUNTRY',
    title: 'Country',
    filterType: 'dataset',
    dimensionValues: [
      { id: 'FR', name: 'France', isSelectedValue: true },
      { id: 'DE', name: 'Germany', isSelectedValue: false },
    ],
  },
  {
    id: 'FREQUENCY',
    title: 'Frequency',
    filterType: 'dataset',
    dimensionValues: [
      { id: 'A', name: 'Annual', isSelectedValue: true },
      { id: 'M', name: 'Monthly', isSelectedValue: false },
    ],
  },
];

const makeDefaultProps = (): FiltersProps => ({
  conversationKey: 'test-conversation',
  conversation: { name: 'Conversation', messages: [] } as any,
  setConversation: jest.fn(),
  updateConversation: jest.fn(() => Promise.resolve({} as any)),
  updateDataQueries: jest.fn(),
  onFiltersChange: jest.fn(),
  actions: {
    getConstraints: jest.fn(() =>
      Promise.resolve({
        data: { dataConstraints: UPDATED_CONSTRAINTS },
      } as any),
    ),
  },
  dimensions: [{ id: 'COUNTRY' }, { id: 'FREQUENCY' }] as any,
  structures: { dataStructures: [] } as any,
  structureDimensions: [],
  initialConstraints: [],
  attachmentsDataQuery: { urn: DATASET_URN } as DataQuery,
  dataQueries: [{ urn: DATASET_URN } as DataQuery],
  modalProps: { isShowTimeSeriesCount: true },
});

const getSelectedIds = (filter?: Filter): string[] =>
  filter?.dimensionValues
    ?.filter((value) => value.isSelectedValue)
    .map((value) => value.id) ?? [];

const getControllerFilter = (id: string): Filter | undefined =>
  mockCallbacks.controller?.state.filtersList.find(
    (filter) => filter.id === id,
  );

const serializeSelectedFilters = (filters: Filter[]): string | null => {
  const selected = filters.flatMap((filter) =>
    getSelectedIds(filter).map((valueId) => `${filter.id}:${valueId}`),
  );
  return selected.length ? selected.join('|') : null;
};

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

const renderFilters = async (
  props: Partial<FiltersProps> = {},
): Promise<FiltersProps> => {
  const defaultProps = makeDefaultProps();

  await act(async () => {
    render(createElement(Filters, { ...defaultProps, ...props }));
  });
  await flushPromises();

  return { ...defaultProps, ...props };
};

const openModal = async () => {
  await act(async () => {
    mockCallbacks.setModalState?.('opened');
  });
  await flushPromises();
};

const closeModal = async () => {
  await act(async () => {
    mockCallbacks.onClose?.();
  });
  await flushPromises();
};

beforeEach(() => {
  mockCallbacks.setModalState = null;
  mockCallbacks.selectedFiltersCount = null;
  mockCallbacks.controller = null;
  mockCallbacks.onApply = null;
  mockCallbacks.onClose = null;
  mockCallbacks.onClearAllFilters = null;
  mockCallbacks.applyDisabled = undefined;

  jest.clearAllMocks();

  mockGetSingleDatasetFiltersPreselectedByDataQuery.mockReturnValue(
    makeInitialFilters(),
  );
  mockGetSingleDatasetConstraintsRequest.mockImplementation(
    (
      _actions: FiltersProps['actions'],
      _attachmentUrn: string,
      filters: Filter[],
    ) => ({
      request: Promise.resolve({
        data: { dataConstraints: UPDATED_CONSTRAINTS },
      }),
      shouldTrackLoading: false,
      filters,
    }),
  );
  mockGetFilledFilters.mockImplementation((filters: Filter[]) =>
    cloneFilters(filters).map((filter) => ({ ...filter, isDisabled: false })),
  );
  mockCleanIncompatibleFilters.mockImplementation((filters: Filter[]) => ({
    filters,
    changed: false,
  }));
  mockGetQueryFilters.mockImplementation(
    (filters: Filter[]): DatasetQueryFilters => ({
      filterKey: serializeSelectedFilters(filters),
      timeFilter: null,
    }),
  );
  mockSetDataQueryFilters.mockImplementation((filters: Filter[]) =>
    filters
      .filter((filter) => getSelectedIds(filter).length)
      .map((filter) => ({
        componentCode: filter.id,
        values: getSelectedIds(filter),
      })),
  );
  mockUpdateMessagesWithSystemMessage.mockReturnValue(SYSTEM_MESSAGES);
  mockGetUpdatedDataQueries.mockReturnValue(UPDATED_DATA_QUERIES);
});

describe('Filters', () => {
  it('does not initialize filters until structural data is available', async () => {
    await renderFilters({ structures: undefined });

    expect(
      mockGetSingleDatasetFiltersPreselectedByDataQuery,
    ).not.toHaveBeenCalled();
    expect(mockCallbacks.selectedFiltersCount).toBe(0);
  });

  it('initializes from data query and exposes the unified FilterSettings controller', async () => {
    await renderFilters();
    await openModal();

    expect(mockCallbacks.selectedFiltersCount).toBe(2);
    expect(mockCallbacks.controller?.state.filtersList).toHaveLength(2);
    expect(mockCallbacks.controller?.state.selectedFilter).toMatchObject({
      id: 'COUNTRY',
      isSelectedFilter: true,
    });
    expect(mockCallbacks.controller?.state.disabledDatasetUrns.size).toBe(0);
    expect(mockCallbacks.controller?.options.dataQueries).toEqual([
      { urn: DATASET_URN },
    ]);
    expect(mockCallbacks.controller?.handlers.onToggleDataset).toEqual(
      expect.any(Function),
    );
    expect(mockCallbacks.controller?.handlers.onClearAllDatasets).toEqual(
      expect.any(Function),
    );
  });

  it('disables Apply when modal filters are unchanged', async () => {
    await renderFilters();
    await openModal();

    expect(mockCallbacks.applyDisabled).toBe(true);
  });

  it('keeps selectedTimeOption after close and reopen', async () => {
    await renderFilters();
    await openModal();

    expect(mockCallbacks.controller?.state.selectedTimeOption).toBeUndefined();

    await act(async () => {
      mockCallbacks.controller?.handlers.onTimePeriodChange?.('last-5-years');
    });
    await flushPromises();

    expect(mockCallbacks.controller?.state.selectedTimeOption).toBe(
      'last-5-years',
    );

    await closeModal();
    await openModal();

    expect(mockCallbacks.controller?.state.selectedTimeOption).toBe(
      'last-5-years',
    );
  });

  it('applies edited modal filters and updates conversation state', async () => {
    const props = await renderFilters();
    await openModal();

    const countryFilter = getControllerFilter('COUNTRY') as Filter;
    const updatedCountryFilter = {
      ...countryFilter,
      dimensionValues: countryFilter.dimensionValues?.map((value) =>
        value.id === 'DE' ? { ...value, isSelectedValue: true } : value,
      ),
    };

    await act(async () => {
      mockCallbacks.controller?.handlers.updateSelectedFilterValues?.(
        updatedCountryFilter,
      );
    });
    await flushPromises();

    expect(getSelectedIds(getControllerFilter('COUNTRY'))).toEqual([
      'FR',
      'DE',
    ]);
    expect(mockCallbacks.applyDisabled).toBe(false);

    await act(async () => {
      mockCallbacks.onApply?.();
      await Promise.resolve();
    });
    await flushPromises();

    expect(props.onFiltersChange).toHaveBeenCalledWith(
      { filterKey: 'COUNTRY:FR|COUNTRY:DE|FREQUENCY:A', timeFilter: null },
      UPDATED_CONSTRAINTS,
      expect.arrayContaining([
        expect.objectContaining({
          id: 'COUNTRY',
          dimensionValues: expect.arrayContaining([
            expect.objectContaining({ id: 'DE', isSelectedValue: true }),
          ]),
        }),
      ]),
    );
    expect(props.setConversation).toHaveBeenCalledWith(
      expect.objectContaining({ messages: SYSTEM_MESSAGES }),
    );
    expect(mockUpdateMessagesWithSystemMessage).toHaveBeenCalledWith(
      props.conversation?.messages,
      props.dataQueries,
      void 0,
      expect.arrayContaining([
        { componentCode: 'COUNTRY', values: ['FR', 'DE'] },
        { componentCode: 'FREQUENCY', values: ['A'] },
      ]),
      props.attachmentsDataQuery,
    );
    expect(mockUpdateMessagesWithSystemMessage.mock.calls[0]).toHaveLength(5);
    expect(props.updateDataQueries).toHaveBeenCalledWith(UPDATED_DATA_QUERIES);
    expect(props.updateConversation).toHaveBeenCalledWith('test-conversation', {
      name: 'Conversation',
      messages: SYSTEM_MESSAGES,
    });
  });

  it('clears only the deleted filter before apply', async () => {
    const props = await renderFilters();
    await openModal();

    await act(async () => {
      mockCallbacks.controller?.handlers.onDeleteFilter?.(
        getControllerFilter('COUNTRY'),
      );
    });
    await flushPromises();

    expect(getSelectedIds(getControllerFilter('COUNTRY'))).toEqual([]);
    expect(getSelectedIds(getControllerFilter('FREQUENCY'))).toEqual(['A']);

    await act(async () => {
      mockCallbacks.onApply?.();
      await Promise.resolve();
    });
    await flushPromises();

    expect(props.onFiltersChange).toHaveBeenCalledWith(
      { filterKey: 'FREQUENCY:A', timeFilter: null },
      UPDATED_CONSTRAINTS,
      expect.arrayContaining([
        expect.objectContaining({
          id: 'COUNTRY',
          dimensionValues: expect.arrayContaining([
            expect.objectContaining({ id: 'FR', isSelectedValue: false }),
          ]),
        }),
        expect.objectContaining({
          id: 'FREQUENCY',
          dimensionValues: expect.arrayContaining([
            expect.objectContaining({ id: 'A', isSelectedValue: true }),
          ]),
        }),
      ]),
    );
  });

  it('re-runs constraints with cleaned filters when incompatible values are removed', async () => {
    await renderFilters();
    await openModal();

    const countryFilter = getControllerFilter('COUNTRY') as Filter;
    const frequencyFilter = getControllerFilter('FREQUENCY') as Filter;
    const updatedCountryFilter = {
      ...countryFilter,
      dimensionValues: countryFilter.dimensionValues?.map((value) =>
        value.id === 'DE' ? { ...value, isSelectedValue: true } : value,
      ),
    };
    const cleanedCountryFilter = {
      ...updatedCountryFilter,
      dimensionValues: updatedCountryFilter.dimensionValues?.map((value) =>
        value.id === 'DE' ? { ...value, isSelectedValue: false } : value,
      ),
    };
    const cleanedFilters = [cleanedCountryFilter, frequencyFilter];

    mockGetSingleDatasetConstraintsRequest.mockClear();
    mockCleanIncompatibleFilters
      .mockReturnValueOnce({
        filters: cleanedFilters,
        changed: true,
      })
      .mockReturnValue({
        filters: cleanedFilters,
        changed: false,
      });

    await act(async () => {
      mockCallbacks.controller?.handlers.updateSelectedFilterValues?.(
        updatedCountryFilter,
      );
    });
    await flushPromises();

    expect(mockGetSingleDatasetConstraintsRequest).toHaveBeenCalledTimes(2);
    expect(mockCleanIncompatibleFilters).toHaveBeenCalledTimes(2);
    expect(getSelectedIds(getControllerFilter('COUNTRY'))).toEqual(['FR']);
  });

  it('drops unapplied modal edits after close and reopen', async () => {
    const props = await renderFilters();
    await openModal();

    const countryFilter = getControllerFilter('COUNTRY') as Filter;
    await act(async () => {
      mockCallbacks.controller?.handlers.updateSelectedFilterValues?.({
        ...countryFilter,
        dimensionValues: countryFilter.dimensionValues?.map((value) =>
          value.id === 'DE' ? { ...value, isSelectedValue: true } : value,
        ),
      });
    });
    await flushPromises();

    expect(getSelectedIds(getControllerFilter('COUNTRY'))).toEqual([
      'FR',
      'DE',
    ]);

    await closeModal();
    await openModal();

    expect(getSelectedIds(getControllerFilter('COUNTRY'))).toEqual(['FR']);
    expect(props.onFiltersChange).not.toHaveBeenCalled();
  });
});
