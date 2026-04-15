import { TimeRange } from '@epam/statgpt-shared-toolkit';
import { getMergedInitialConstraints } from '../time-period';

const d = (iso: string) => new Date(iso);

const range = (start: string | null, end: string | null): TimeRange => ({
  startPeriod: start ? d(start) : null,
  endPeriod: end ? d(end) : null,
});

describe('getMergedInitialConstraints', () => {
  describe('selectedTimeRange is null', () => {
    it('returns initialTimeRange unchanged', () => {
      const initial = range('2020-01-01', '2023-12-31');
      expect(getMergedInitialConstraints(initial, null)).toEqual(initial);
    });

    it('returns initialTimeRange unchanged when both periods are null', () => {
      const initial = range(null, null);
      expect(getMergedInitialConstraints(initial, null)).toEqual(range(null, null));
    });
  });

  describe('initialTimeRange has no startPeriod', () => {
    it('uses selected.startPeriod when initial.startPeriod is null', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range(null, '2023-12-31'),
        range('2019-06-01', null),
      );
      expect(startPeriod).toEqual(d('2019-06-01'));
      expect(endPeriod).toEqual(d('2023-12-31'));
    });
  });

  describe('initialTimeRange has no endPeriod', () => {
    it('uses selected.endPeriod when initial.endPeriod is null', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', null),
        range(null, '2025-06-01'),
      );
      expect(startPeriod).toEqual(d('2020-01-01'));
      expect(endPeriod).toEqual(d('2025-06-01'));
    });
  });

  describe('both periods null in initialTimeRange', () => {
    it('uses both periods from selected', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range(null, null),
        range('2019-01-01', '2024-12-31'),
      );
      expect(startPeriod).toEqual(d('2019-01-01'));
      expect(endPeriod).toEqual(d('2024-12-31'));
    });
  });

  describe('startPeriod comparison', () => {
    it('uses selected.startPeriod when it is earlier than initial.startPeriod', () => {
      const { startPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2018-06-01', '2022-01-01'),
      );
      expect(startPeriod).toEqual(d('2018-06-01'));
    });

    it('keeps initial.startPeriod when selected.startPeriod is later', () => {
      const { startPeriod } = getMergedInitialConstraints(
        range('2018-01-01', '2023-12-31'),
        range('2020-06-01', '2022-01-01'),
      );
      expect(startPeriod).toEqual(d('2018-01-01'));
    });

    it('keeps initial.startPeriod when both startPeriods are equal', () => {
      const { startPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2020-01-01', '2022-01-01'),
      );
      expect(startPeriod).toEqual(d('2020-01-01'));
    });
  });

  describe('endPeriod comparison', () => {
    it('uses selected.endPeriod when it is later than initial.endPeriod', () => {
      const { endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2021-01-01', '2025-06-01'),
      );
      expect(endPeriod).toEqual(d('2025-06-01'));
    });

    it('keeps initial.endPeriod when selected.endPeriod is earlier', () => {
      const { endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2021-01-01', '2022-06-01'),
      );
      expect(endPeriod).toEqual(d('2023-12-31'));
    });

    it('keeps initial.endPeriod when both endPeriods are equal', () => {
      const { endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2021-01-01', '2023-12-31'),
      );
      expect(endPeriod).toEqual(d('2023-12-31'));
    });
  });

  describe('both boundaries expanded', () => {
    it('expands both startPeriod and endPeriod when selected is wider', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range('2017-03-15', '2026-09-01'),
      );
      expect(startPeriod).toEqual(d('2017-03-15'));
      expect(endPeriod).toEqual(d('2026-09-01'));
    });
  });

  describe('selectedTimeRange is within initial bounds', () => {
    it('returns initial unchanged when selected is completely within it', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range('2018-01-01', '2025-12-31'),
        range('2020-06-01', '2023-06-01'),
      );
      expect(startPeriod).toEqual(d('2018-01-01'));
      expect(endPeriod).toEqual(d('2025-12-31'));
    });
  });

  describe('selectedTimeRange has no periods', () => {
    it('keeps initial when selected has null startPeriod and endPeriod', () => {
      const { startPeriod, endPeriod } = getMergedInitialConstraints(
        range('2020-01-01', '2023-12-31'),
        range(null, null),
      );
      expect(startPeriod).toEqual(d('2020-01-01'));
      expect(endPeriod).toEqual(d('2023-12-31'));
    });
  });

  describe('immutability', () => {
    it('does not mutate the initialTimeRange object', () => {
      const initial = range('2020-01-01', '2023-12-31');
      const { startPeriod: origStart, endPeriod: origEnd } = initial;
      getMergedInitialConstraints(initial, range('2017-01-01', '2026-12-31'));
      expect(initial.startPeriod).toBe(origStart);
      expect(initial.endPeriod).toBe(origEnd);
    });
  });
});
