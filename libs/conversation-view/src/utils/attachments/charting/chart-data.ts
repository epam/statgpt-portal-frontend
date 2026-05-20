import {
  DataMessage,
  Dimension,
  getDimensions,
  getLocalizedName,
  getTimePeriods,
  sortPeriods,
  StructuralData,
  isMonthly,
  isQuarterly,
  isYearly,
  FREQUENCY_DIMENSION_ID,
  Periods,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

import { getRowsData } from '../data-grid/rows-data';
import { ChartingStyles } from '../../../models/attachments-styles';
import { GridData } from '../../../types/data-grid/grid-data';
import { buildChartConfig } from './chart-config-building';
import {
  ChartingData,
  ChartUnit,
  ChartUnitRows,
  DimensionInfo,
} from '../../../models/charting';
import { buildSerieKeyTitle } from './serie-title';
import { buildSortedNonRegionDimensionsList } from './sort-dimensions';
import { splitForUnits } from './split-for-units';
import { getDimensionsUniquenessByValues } from './data-uniqueness';
import { getDimRelatedStructures } from '../localized-value';

const LINE_TYPE = 'line';
const MAX_LINES_PER_UNIT = 10;

export function buildChartData(
  structures: StructuralData,
  data: DataMessage,
  dataQuery: DataQuery | undefined,
  locale: string,
  styles?: ChartingStyles,
): ChartingData {
  const rows = getRowsData(data, structures, dataQuery, locale, styles, {
    includeChartData: false,
  });
  const timePeriods = getTimePeriods(data);
  const sortedTimePeriods = timePeriods.sort((a, b) => sortPeriods(a, b));
  const sortedDimensionsList = buildSortedNonRegionDimensionsList(
    structures,
    dataQuery,
  );

  const { nonUniqDimensions } = getDimensionsUniquenessByValues(
    sortedDimensionsList,
    rows,
  );

  const units = splitForUnits(rows, nonUniqDimensions, structures);

  return {
    units: units.map((unit) =>
      buildUnit(unit, structures, dataQuery, sortedTimePeriods, locale, styles),
    ),
  };
}

export function createChartDataResolver(
  structures: StructuralData,
  data: DataMessage,
  dataQuery: DataQuery | undefined,
  locale: string,
  styles?: ChartingStyles,
): () => ChartingData {
  let cachedChartingData: ChartingData | undefined;

  return () => {
    cachedChartingData ??= buildChartData(
      structures,
      data,
      dataQuery,
      locale,
      styles,
    );

    return cachedChartingData;
  };
}

export function buildSingleLineUnit(
  row: GridData,
  sortedTimePeriods: string[],
  structures: StructuralData,
  dataQuery: DataQuery | undefined,
  locale: string,
  styles?: ChartingStyles,
): ChartUnit {
  return buildUnit(
    { rows: [row] },
    structures,
    dataQuery,
    sortedTimePeriods,
    locale,
    styles,
  );
}

export function buildUnit(
  unit: ChartUnitRows,
  structures: StructuralData,
  dataQuery: DataQuery | undefined,
  timePeriods: string[],
  locale: string,
  styles?: ChartingStyles,
): ChartUnit {
  const dimensions = getDimensionsInfo(
    unit.rows,
    structures,
    dataQuery,
    locale,
  );
  const frequencyDimensionId = dimensions?.find((dimension) =>
    FREQUENCY_DIMENSION_ID.includes(dimension?.id),
  )?.id;
  const series = buildChartSeries(
    unit.rows.length > MAX_LINES_PER_UNIT
      ? unit.rows.slice(0, MAX_LINES_PER_UNIT)
      : unit.rows,
    structures,
    dataQuery,
    locale,
    filterTimePeriodsByFrequency(
      timePeriods,
      unit?.rows?.[0],
      frequencyDimensionId,
    ),
  );

  return {
    rows: unit.rows,
    limitedByRowsAmountTo:
      unit.rows.length > MAX_LINES_PER_UNIT ? MAX_LINES_PER_UNIT : undefined,
    dimensions,
    config: buildChartConfig(
      filterTimePeriodsByFrequency(
        timePeriods,
        unit?.rows?.[0],
        frequencyDimensionId,
      ),
      series,
      styles,
    ),
  };
}

function filterTimePeriodsByFrequency(
  timePeriods: string[],
  row: GridData,
  frequencyDimensionId?: string,
) {
  if (frequencyDimensionId) {
    const frequencyTermId = row?.[frequencyDimensionId];
    if (frequencyTermId === Periods.MONTHLY) {
      return timePeriods?.filter((period) => isMonthly(period));
    }
    if (frequencyTermId === Periods.QUARTERLY) {
      return timePeriods?.filter((period) => isQuarterly(period));
    }
    if (frequencyTermId === Periods.ANNUAL) {
      return timePeriods?.filter((period) => isYearly(period));
    }
  }
  return timePeriods;
}

function buildChartSeries(
  rows: GridData[],
  structures: StructuralData,
  dataQuery: DataQuery | undefined,
  locale: string,
  timePeriods: string[],
) {
  return rows.map((row) => {
    return {
      name:
        dataQuery?.metadata?.countryDimension == null
          ? ''
          : buildSerieKeyTitle(
              row,
              [dataQuery?.metadata?.countryDimension],
              structures,
              locale,
            ),
      type: LINE_TYPE,
      data: timePeriods.map((p) => getTimePeriodRowValue(p, row)),
    };
  });
}

function getTimePeriodRowValue(dimKey: string, row: GridData): unknown {
  return (
    (row[dimKey] as { value?: { value?: unknown }[] })?.value?.[0]?.value ||
    null
  );
}

function getDimensionsInfo(
  rows: GridData[],
  structures: StructuralData,
  dataQuery: DataQuery | undefined,
  locale: string,
): DimensionInfo[] {
  const countryDimensionId = dataQuery?.metadata?.countryDimension;
  return (getDimensions(structures)?.dimensions || [])
    .map((dim) => {
      if (dim.id == null || dim.id === countryDimensionId) {
        return;
      }
      return {
        id: dim.id,
        title: getDimTitle(dim, structures, locale),
        value: buildSerieKeyTitle(rows[0], [dim.id], structures, locale),
      };
    })
    .filter((dim): dim is DimensionInfo => dim != null);
}

function getDimTitle(
  dim: Dimension,
  structures: StructuralData,
  locale: string,
): string | undefined {
  const conceptSchemes = structures.conceptSchemes || [];
  const codeLists = structures.codelists || [];
  const { concept } = getDimRelatedStructures(dim, conceptSchemes, codeLists);
  return getLocalizedName(concept, locale) || dim.id;
}
