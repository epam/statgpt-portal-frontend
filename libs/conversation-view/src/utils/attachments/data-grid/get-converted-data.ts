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
  const flatData = getFlatDataForPivot(data, dimensions);

  const gridData: Record<string, GridData> = {};

  for (const key of flatData) {
    const cell = key.rowTime as GridData;
    const rowKey = getKey(cell, rows);
    if (gridData[rowKey] == null) {
      gridData[rowKey] = {};

      for (const row of rows) {
        (gridData[rowKey] as GridData)[row] = cell[row];
      }
    }

    gridData[rowKey] = {
      attributes: (key.attributes as TimeSeriesObservation[]).filter(
        ({ value }: TimeSeriesObservation) => value,
      ),
      ...gridData[rowKey],
      id: rowKey,
      originalData: key.originalData,
      ...fillCellValue(cell, columns),
    };
  }

  return Object.values(gridData);
};

const getKey = (cell: GridData, dimensions: string[]): string =>
  dimensions.map((dimension) => cell[dimension]).join('_');

const fillCellValue = (cell: GridData, columns: string[]): GridData => {
  const key = getKey(cell, columns);
  const { OBS_VALUE, obsAttributes } = cell;

  const gridData: GridData = {};
  gridData[key] = {
    value: OBS_VALUE,
    obsAttributes,
  };

  return gridData;
};

const getFlatDataForPivot = (
  data: TimeSeries[],
  dimensions: string[],
): GridData[] => {
  const flatData: GridData[] = [];

  for (const timeSeries of data) {
    const row: GridData = {};
    const dimValues = timeSeries.name.split('.');

    for (let index = 0; index < dimensions.length; index += 1) {
      row[dimensions[index]] = dimValues[index];
    }

    if (!timeSeries.values.length) {
      const rowTime = { ...row };
      rowTime.TIME_PERIOD = undefined;
      rowTime.OBS_VALUE = undefined;
      flatData.push({
        rowTime,
        attributes: timeSeries.attributes,
        id: timeSeries.name,
        originalData: timeSeries,
      });
    }

    timeSeries.values.forEach((timeSeriesValue) => {
      const rowTime = { ...row };
      // todo: delete TIME_PERIOD
      rowTime.TIME_PERIOD = timeSeriesValue.dimensionAtObservation;

      const value = getCellValue(timeSeries, timeSeriesValue);
      // todo: delete OBS_VALUE
      rowTime.OBS_VALUE = value;
      rowTime.obsAttributes =
        timeSeriesValue?.obsAttributes?.filter(({ value }) => value) || [];
      flatData.push({
        rowTime,
        attributes: timeSeries.attributes,
        id: timeSeries.name,
        originalData: timeSeries,
      });
    });
  }

  return flatData;
};

const getCellValue = (
  timeSer: TimeSeries,
  timeSeriesValue: TimeSeriesValue,
): TimeSeriesObservation[] => {
  const attributes = [...timeSer.attributes, ...timeSeriesValue.obsAttributes];
  const attr = attributes.find(
    ({ name }: TimeSeriesObservation) => name === 'OBS_VALUE',
  );

  return attr ? [attr] : timeSeriesValue.values;
};
