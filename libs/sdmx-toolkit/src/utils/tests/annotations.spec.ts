import { Annotations } from '@statgpt/sdmx-toolkit/src/types/annotations';
import { getLastUpdatedTime } from '../annotations';

describe('getLastUpdatedTime', () => {
  it('returns the value of the LAST_UPDATE_AT annotation', () => {
    const dataset = {
      annotations: [
        { id: Annotations.LAST_UPDATE_AT, value: '2024-07-24T10:00:00Z' },
        { id: 'OTHER', value: 'something else' },
      ],
    };
    expect(getLastUpdatedTime(dataset as any)).toBe('2024-07-24T10:00:00Z');
  });

  it('returns undefined if LAST_UPDATE_AT annotation is not present', () => {
    const dataset = {
      annotations: [{ id: 'OTHER', value: 'no update' }],
    };
    expect(getLastUpdatedTime(dataset as any)).toBeUndefined();
  });

  it('returns undefined if dataset is null or undefined', () => {
    expect(getLastUpdatedTime(null)).toBeUndefined();
    expect(getLastUpdatedTime(undefined)).toBeUndefined();
  });

  it('returns undefined if annotations is undefined', () => {
    const dataset = {};
    expect(getLastUpdatedTime(dataset as any)).toBeUndefined();
  });
});
