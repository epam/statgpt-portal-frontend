import { CalendarResolution } from '@epam/statgpt-shared-toolkit';
import { TextDecoder, TextEncoder } from 'util';

describe('getPickerOptions', () => {
  beforeAll(() => {
    const globalWithEncoding = globalThis as typeof globalThis & {
      TextDecoder?: typeof globalThis.TextDecoder;
      TextEncoder?: typeof globalThis.TextEncoder;
    };

    if (!globalWithEncoding.TextDecoder) {
      globalWithEncoding.TextDecoder =
        TextDecoder as unknown as typeof globalThis.TextDecoder;
    }

    if (!globalWithEncoding.TextEncoder) {
      globalWithEncoding.TextEncoder =
        TextEncoder as unknown as typeof globalThis.TextEncoder;
    }
  });

  it('normalizes day-resolution min and max to full-day boundaries', () => {
    const { getPickerOptions } = require('../attachments/time-period');
    const options = getPickerOptions(
      new Date(2026, 5, 10, 14, 30, 15, 123),
      new Date(2026, 5, 10, 14, 30, 15, 123),
      CalendarResolution.DAY,
      'en',
    );

    const minDate = options.minDate as Date;
    const maxDate = options.maxDate as Date;

    expect(minDate.getHours()).toBe(0);
    expect(minDate.getMinutes()).toBe(0);
    expect(minDate.getSeconds()).toBe(0);
    expect(minDate.getMilliseconds()).toBe(0);

    expect(maxDate.getHours()).toBe(23);
    expect(maxDate.getMinutes()).toBe(59);
    expect(maxDate.getSeconds()).toBe(59);
    expect(maxDate.getMilliseconds()).toBe(999);
  });

  it('keeps month-resolution min and max normalized to month boundaries', () => {
    const { getPickerOptions } = require('../attachments/time-period');
    const options = getPickerOptions(
      new Date(2026, 5, 10, 14, 30, 15, 123),
      new Date(2027, 8, 22, 10, 0, 0, 0),
      CalendarResolution.MONTH,
      'en',
    );

    const minDate = options.minDate as Date;
    const maxDate = options.maxDate as Date;

    expect(minDate.getFullYear()).toBe(2026);
    expect(minDate.getMonth()).toBe(5);
    expect(minDate.getDate()).toBe(1);

    expect(maxDate.getFullYear()).toBe(2027);
    expect(maxDate.getMonth()).toBe(8);
    expect(maxDate.getDate()).toBe(1);
  });
});
