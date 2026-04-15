import { TimeRange } from '@epam/statgpt-shared-toolkit';
import { getMergedInitialConstraints } from '../time-period';

const d = (iso: string) => new Date(iso);

describe('getMergedInitialConstraints', () => {
  describe('selectedTimeRange is null', () => {
    it('returns initialTimeRange unchanged when selectedTimeRange is null', () => {
      const initial: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const result = getMergedInitialConstraints(initial, null);
      expect(result).toEqual(initial);
    });

    it('returns initialTimeRange unchanged when both periods are null and selectedTimeRange is null', () => {
      const initial: TimeRange = { startPeriod: null, endPeriod: null };
      const result = getMergedInitialConstraints(initial, null);
      expect(result).toEqual({ startPeriod: null, endPeriod: null });
    });
  });

  describe('initialTimeRange has no startPeriod', () => {
    it('uses selectedTimeRange.startPeriod when initialTimeRange.startPeriod is null', () => {
      const initial: TimeRange = {
        startPeriod: null,
        endPeriod: d('2023-12-31'),
      };
      const selected: TimeRange = {
        startPeriod: d('2019-06-01'),
        endPeriod: null,
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.startPeriod).toEqual(d('2019-06-01'));
      expect(result.endPeriod).toEqual(d('2023-12-31'));
    });
  });

  describe('initialTimeRange has no endPeriod', () => {
    it('uses selectedTimeRange.endPeriod when initialTimeRange.endPeriod is null', () => {
      const initial: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: null,
      };
      const selected: TimeRange = {
        startPeriod: null,
        endPeriod: d('2025-06-01'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.startPeriod).toEqual(d('2020-01-01'));
      expect(result.endPeriod).toEqual(d('2025-06-01'));
    });
  });

  describe('both periods null in initialTimeRange', () => {
    it('uses both periods from selectedTimeRange', () => {
      const initial: TimeRange = { startPeriod: null, endPeriod: null };
      const selected: TimeRange = {
        startPeriod: d('2019-01-01'),
        endPeriod: d('2024-12-31'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.startPeriod).toEqual(d('2019-01-01'));
      expect(result.endPeriod).toEqual(d('2024-12-31'));
    });
  });

  describe('startPeriod comparison', () => {
    it('uses selectedTimeRange.startPeriod when it is earlier than initialTimeRange.startPeriod', () => {
      const initial: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const selected: TimeRange = {
        startPeriod: d('2018-06-01'),
        endPeriod: d('2022-01-01'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.startPeriod).toEqual(d('2018-06-01'));
    });

    it('keeps initialTimeRange.startPeriod when selectedTimeRange.startPeriod is later', () => {
      const initial: TimeRange = {
        startPeriod: d('2018-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const selected: TimeRange = {
        startPeriod: d('2020-06-01'),
        endPeriod: d('2022-01-01'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.startPeriod).toEqual(d('2018-01-01'));
    });

    it('keeps initialTimeRange.startPeriod when both startPeriods are equal', () => {
      const initial: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const selected: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: d('2022-01-01'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.startPeriod).toEqual(d('2020-01-01'));
    });
  });

  describe('endPeriod comparison', () => {
    it('uses selectedTimeRange.endPeriod when it is later than initialTimeRange.endPeriod', () => {
      const initial: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const selected: TimeRange = {
        startPeriod: d('2021-01-01'),
        endPeriod: d('2025-06-01'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.endPeriod).toEqual(d('2025-06-01'));
    });

    it('keeps initialTimeRange.endPeriod when selectedTimeRange.endPeriod is earlier', () => {
      const initial: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const selected: TimeRange = {
        startPeriod: d('2021-01-01'),
        endPeriod: d('2022-06-01'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.endPeriod).toEqual(d('2023-12-31'));
    });

    it('keeps initialTimeRange.endPeriod when both endPeriods are equal', () => {
      const initial: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const selected: TimeRange = {
        startPeriod: d('2021-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.endPeriod).toEqual(d('2023-12-31'));
    });
  });

  describe('both boundaries expanded', () => {
    it('expands both startPeriod and endPeriod when selectedTimeRange is wider', () => {
      const initial: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const selected: TimeRange = {
        startPeriod: d('2017-03-15'),
        endPeriod: d('2026-09-01'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.startPeriod).toEqual(d('2017-03-15'));
      expect(result.endPeriod).toEqual(d('2026-09-01'));
    });
  });

  describe('selectedTimeRange is within initial bounds', () => {
    it('returns initialTimeRange unchanged when selectedTimeRange is completely within it', () => {
      const initial: TimeRange = {
        startPeriod: d('2018-01-01'),
        endPeriod: d('2025-12-31'),
      };
      const selected: TimeRange = {
        startPeriod: d('2020-06-01'),
        endPeriod: d('2023-06-01'),
      };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.startPeriod).toEqual(d('2018-01-01'));
      expect(result.endPeriod).toEqual(d('2025-12-31'));
    });
  });

  describe('selectedTimeRange has no periods', () => {
    it('keeps initialTimeRange when selectedTimeRange has null startPeriod and endPeriod', () => {
      const initial: TimeRange = {
        startPeriod: d('2020-01-01'),
        endPeriod: d('2023-12-31'),
      };
      const selected: TimeRange = { startPeriod: null, endPeriod: null };
      const result = getMergedInitialConstraints(initial, selected);
      expect(result.startPeriod).toEqual(d('2020-01-01'));
      expect(result.endPeriod).toEqual(d('2023-12-31'));
    });
  });

});
