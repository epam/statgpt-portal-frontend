import {
  Dimension,
  TimeSeries,
  TimeSeriesObservation,
  TimeSeriesValue,
} from '@epam/statgpt-sdmx-toolkit';
import { getConvertedData } from '../get-converted-data';

const dimensions = [{ id: 'FREQ' }, { id: 'REF_AREA' }] as Dimension[];

const timeDimensions = [{ id: 'TIME_PERIOD' }] as Dimension[];

describe('getConvertedData', () => {
  it('pivots observations into one grid row per dimension combination', () => {
    const series = buildSeries({
      name: 'A.US',
      values: [
        buildValue('2020', '10'),
        buildValue('2021', '12', [
          { name: 'OBS_STATUS', value: 'E' } as TimeSeriesObservation,
        ]),
      ],
      attributes: [
        { name: 'UNIT', value: 'USD' } as TimeSeriesObservation,
        { name: 'EMPTY', value: '' } as TimeSeriesObservation,
      ],
    });

    expect(getConvertedData([series], dimensions, timeDimensions)).toEqual([
      {
        FREQ: 'A',
        REF_AREA: 'US',
        attributes: [{ name: 'UNIT', value: 'USD' }],
        id: 'A_US',
        originalData: series,
        '2020': {
          value: [{ name: 'OBS_VALUE', value: '10' }],
          obsAttributes: [],
        },
        '2021': {
          value: [{ name: 'OBS_VALUE', value: '12' }],
          obsAttributes: [{ name: 'OBS_STATUS', value: 'E' }],
        },
      },
    ]);
  });

  it('keeps the empty cell produced for a series without observations', () => {
    const series = buildSeries({
      name: 'M.FR',
      values: [],
      attributes: [{ name: 'UNIT', value: 'EUR' } as TimeSeriesObservation],
    });

    expect(getConvertedData([series], dimensions, timeDimensions)).toEqual([
      {
        FREQ: 'M',
        REF_AREA: 'FR',
        attributes: [{ name: 'UNIT', value: 'EUR' }],
        id: 'M_FR',
        originalData: series,
        '': {
          value: undefined,
          obsAttributes: undefined,
        },
      },
    ]);
  });

  it('uses OBS_VALUE attributes before observation values', () => {
    const seriesAttribute = {
      name: 'OBS_VALUE',
      value: 'series-value',
    } as TimeSeriesObservation;
    const observationAttribute = {
      name: 'OBS_VALUE',
      value: 'observation-attribute-value',
    } as TimeSeriesObservation;
    const series = buildSeries({
      name: 'Q.DE',
      values: [buildValue('2020-Q1', 'raw-value', [observationAttribute])],
      attributes: [seriesAttribute],
    });

    const [row] = getConvertedData([series], dimensions, timeDimensions);

    expect(row['2020-Q1']).toEqual({
      value: [seriesAttribute],
      obsAttributes: [observationAttribute],
    });
  });
});

function buildSeries({
  name,
  values,
  attributes = [],
}: {
  name: string;
  values: TimeSeriesValue[];
  attributes?: TimeSeriesObservation[];
}): TimeSeries {
  return {
    name,
    values,
    attributes,
  } as TimeSeries;
}

function buildValue(
  dimensionAtObservation: string,
  value: string,
  obsAttributes: TimeSeriesObservation[] = [],
): TimeSeriesValue {
  return {
    dimensionAtObservation,
    values: [{ name: 'OBS_VALUE', value }],
    obsAttributes,
  } as TimeSeriesValue;
}
