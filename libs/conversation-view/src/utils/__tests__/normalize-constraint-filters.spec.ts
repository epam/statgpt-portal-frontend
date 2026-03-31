import { normalizeConstraintFilters } from '../normalize-constraint-filters';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({}));

describe('normalizeConstraintFilters', () => {
  it('returns an empty array for empty input', () => {
    expect(normalizeConstraintFilters([])).toEqual([]);
  });

  it('sorts comma-separated values within each filter', () => {
    const result = normalizeConstraintFilters([
      { componentCode: 'COUNTRY', operator: 'eq', value: 'DE,FR,AR' },
    ] as any[]);
    expect(result[0].value).toBe('AR,DE,FR');
  });

  it('sorts filters by componentCode', () => {
    const result = normalizeConstraintFilters([
      { componentCode: 'FREQ', operator: 'eq', value: 'A' },
      { componentCode: 'COUNTRY', operator: 'eq', value: 'FR' },
    ] as any[]);
    expect(result.map((f) => f.componentCode)).toEqual(['COUNTRY', 'FREQ']);
  });

  it('does not mutate the original array', () => {
    const input = [
      { componentCode: 'FREQ', operator: 'eq', value: 'A' },
      { componentCode: 'COUNTRY', operator: 'eq', value: 'FR' },
    ] as any[];
    normalizeConstraintFilters(input);
    expect(input[0].componentCode).toBe('FREQ');
  });

  it('leaves a single-value filter unchanged', () => {
    const result = normalizeConstraintFilters([
      { componentCode: 'FREQ', operator: 'eq', value: 'A' },
    ] as any[]);
    expect(result[0].value).toBe('A');
  });
});
