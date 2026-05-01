import {
  TimeSeries,
  TimeSeriesObservation,
  TimeSeriesValue,
  Dimension,
} from '@epam/statgpt-sdmx-toolkit';
import { GridData } from '../../../types/data-grid/grid-data';

export function getConvertedData(
  timeSeries: TimeSeries[],
  dimensions: Dimension[],
  timeDimensions: Dimension[],
): GridData[] {
  const dimensionsIds = dimensions
    .map((dsdDimension) => dsdDimension.id)
    .filter((id) => id != null);
  const timeDimensionsIds = timeDimensions
    .map((dimension) => dimension.id)
    .filter((id) => id != null);

  return getGridData(
    timeSeries,
    dimensionsIds,
    timeDimensionsIds,
    dimensionsIds,
  );
}

export const getGridData = (
  data: TimeSeries[],
  dimensions: string[],
  columns: string[],
  rows: string[],
): GridData[] => {
  const gridData: Record<string, GridData> = {};

  for (const timeSeries of data) {
    const row = getSeriesRow(timeSeries, dimensions);
    const rowKey = getKey(row, rows);
    let gridRow = gridData[rowKey];

    if (gridRow == null) {
      gridRow = {};
      gridData[rowKey] = gridRow;

      for (const rowId of rows) {
        gridRow[rowId] = row[rowId];
      }
    }

    const attributes = getFilledAttributes(timeSeries.attributes);
    fillRowMetadata(gridRow, rowKey, attributes, timeSeries);

    if (!timeSeries.values.length) {
      fillCellValue(gridRow, row, columns);
      continue;
    }

    for (const timeSeriesValue of timeSeries.values) {
      const obsAttributes = getFilledAttributes(timeSeriesValue.obsAttributes);

      fillRowMetadata(gridRow, rowKey, attributes, timeSeries);
      fillCellValue(
        gridRow,
        row,
        columns,
        timeSeriesValue.dimensionAtObservation,
        getCellValue(timeSeries, timeSeriesValue),
        obsAttributes,
      );
    }
  }

  return Object.values(gridData);
};

const getKey = (cell: GridData, dimensions: string[]): string =>
  dimensions.map((dimension) => cell[dimension]).join('_');

const getObservationKey = (
  row: GridData,
  columns: string[],
  timePeriod?: string,
): string =>
  columns
    .map((column) => (column === 'TIME_PERIOD' ? timePeriod : row[column]))
    .join('_');

const fillCellValue = (
  gridRow: GridData,
  row: GridData,
  columns: string[],
  timePeriod?: string,
  value?: TimeSeriesObservation[],
  obsAttributes?: TimeSeriesObservation[],
): void => {
  const key = getObservationKey(row, columns, timePeriod);

  gridRow[key] = {
    value,
    obsAttributes,
  };
};

const getSeriesRow = (
  timeSeries: TimeSeries,
  dimensions: string[],
): GridData => {
  const row: GridData = {};
  const dimValues = timeSeries.name.split('.');

  for (let index = 0; index < dimensions.length; index += 1) {
    row[dimensions[index]] = dimValues[index];
  }

  return row;
};

const getCellValue = (
  timeSer: TimeSeries,
  timeSeriesValue: TimeSeriesValue,
): TimeSeriesObservation[] => {
  const seriesAttribute = findObservationValueAttribute(timeSer.attributes);
  if (seriesAttribute) {
    return [seriesAttribute];
  }

  const obsAttribute = findObservationValueAttribute(
    timeSeriesValue.obsAttributes,
  );
  if (obsAttribute) {
    return [obsAttribute];
  }

  return timeSeriesValue.values;
};

const findObservationValueAttribute = (
  attributes: TimeSeriesObservation[] = [],
): TimeSeriesObservation | undefined =>
  attributes.find(({ name }: TimeSeriesObservation) => name === 'OBS_VALUE');

const getFilledAttributes = (
  attributes: TimeSeriesObservation[] = [],
): TimeSeriesObservation[] =>
  attributes.filter(({ value }: TimeSeriesObservation) => value);

const fillRowMetadata = (
  gridRow: GridData,
  rowKey: string,
  attributes: TimeSeriesObservation[],
  originalData: TimeSeries,
): void => {
  gridRow.attributes ??= attributes;
  gridRow.id = rowKey;
  gridRow.originalData = originalData;
};
