import { getFilledFilters } from '../get-filled-filters';
import type { Filter } from '../../models/filters';

// ─── Mock functions ───────────────────────────────────────────────────────────

const mockFindCodelistByDimension = jest.fn(() => null as any);
const mockGetAvailableCodesFromConstrains = jest.fn(() => [] as any[]);

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  findCodelistByDimension: (...args: any[]) =>
    (mockFindCodelistByDimension as any)(...args),
  getAvailableCodesFromConstrains: (...args: any[]) =>
    (mockGetAvailableCodesFromConstrains as any)(...args),
}));

jest.mock('@epam/statgpt-shared-toolkit', () => ({
  Locale: { EN: 'en' },
}));

// ─── Default mock reset ───────────────────────────────────────────────────────

beforeEach(() => {
  mockFindCodelistByDimension.mockReturnValue(null);
  mockGetAvailableCodesFromConstrains.mockReturnValue([]);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getFilledFilters', () => {
  it('returns an empty array when filters is undefined', () => {
    expect(getFilledFilters(undefined)).toEqual([]);
  });

  it('fills dimensionValues from constrained codes for each filter', () => {
    const dimension = { id: 'FREQ' } as any;
    const constrainedValues = [
      { id: 'A', name: 'Annual', isSelectedValue: undefined },
    ];
    mockGetAvailableCodesFromConstrains.mockReturnValue(constrainedValues);

    const filter: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      dimensionValues: [],
    };

    const result = getFilledFilters([filter], [dimension]);

    expect(result[0].dimensionValues).toHaveLength(1);
    expect(result[0].dimensionValues![0].id).toBe('A');
  });

  it('preserves isSelectedValue from the original filter for matching dimension values', () => {
    const dimension = { id: 'COUNTRY' } as any;
    mockGetAvailableCodesFromConstrains.mockReturnValue([
      { id: 'FR', name: 'France' },
      { id: 'DE', name: 'Germany' },
    ]);

    const filter: Filter = {
      id: 'COUNTRY',
      filterType: 'dataset',
      dimensionValues: [
        { id: 'FR', isSelectedValue: true },
        { id: 'DE', isSelectedValue: false },
      ],
    };

    const result = getFilledFilters([filter], [dimension]);
    const values = result[0].dimensionValues!;

    expect(values.find((v) => v.id === 'FR')?.isSelectedValue).toBe(true);
    expect(values.find((v) => v.id === 'DE')?.isSelectedValue).toBe(false);
  });

  it('sets isDisabled to false regardless of the original filter value', () => {
    const filter: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      isDisabled: true,
      dimensionValues: [],
    };

    const result = getFilledFilters([filter], [{ id: 'FREQ' } as any]);

    expect(result[0].isDisabled).toBe(false);
  });

  it('sets dimensionValues to [] when no dimension matches the filter id', () => {
    const filter: Filter = {
      id: 'COUNTRY',
      filterType: 'dataset',
      dimensionValues: [{ id: 'FR', isSelectedValue: true }],
    };

    const result = getFilledFilters([filter], [{ id: 'FREQ' } as any]);

    expect(result[0].dimensionValues).toEqual([]);
  });
});
