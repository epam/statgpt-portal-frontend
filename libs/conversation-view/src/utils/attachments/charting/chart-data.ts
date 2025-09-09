import { DataMessage } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import {
  getDimensions,
  getTimePeriods,
} from '@statgpt/sdmx-toolkit/src/utils/get-dimensions';
import { getRowsData } from '@statgpt/conversation-view/src/utils/attachments/data-grid/rows-data';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { ChartingStyles } from '@statgpt/conversation-view/src/models/attachments-styles';
import { GridData } from '@statgpt/conversation-view/src/types/data-grid/grid-data';
import { buildChartConfig } from '@statgpt/conversation-view/src/utils/attachments/charting/chart-config-building';
import {
  ChartingData,
  ChartUnit,
  ChartUnitRows,
  DimensionInfo,
} from '@statgpt/conversation-view/src/models/charting';
import { buildSerieKeyTitle } from '@statgpt/conversation-view/src/utils/attachments/charting/serie-title';
import { buildSortedNonRegionDimensionsList } from '@statgpt/conversation-view/src/utils/attachments/charting/sort-dimensions';
import { splitForUnits } from '@statgpt/conversation-view/src/utils/attachments/charting/split-for-units';
import { getDimensionsUniquenessByValues } from '@statgpt/conversation-view/src/utils/attachments/charting/data-uniqueness';
import { sortPeriods } from '@statgpt/sdmx-toolkit/src/parsers/time-period-parser/period-sorting';
import { getDimRelatedStructures } from '@statgpt/conversation-view/src/utils/attachments/localized-value';
import { getLocalizedName } from '@statgpt/sdmx-toolkit/src/utils/get-localized-name';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { FrequencyDimension } from '@statgpt/sdmx-toolkit/src/constants/frequency-dimension';
import { Periods } from '@statgpt/sdmx-toolkit/src/types/periods';
import {
  isMonthly,
  isQuarterly,
  isYearly,
} from '@statgpt/sdmx-toolkit/src/parsers/time-period-parser/define-period';

const LINE_TYPE = 'line';
const MAX_LINES_PER_UNIT = 10;

export function buildChartData(
  structures: StructuralData,
  data: DataMessage,
  dataQuery: DataQuery | undefined,
  locale: string,
  styles?: ChartingStyles,
): ChartingData {
  const rows = getRowsData(data, structures, dataQuery, locale, styles);
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
  const series = buildChartSeries(
    unit.rows.length > MAX_LINES_PER_UNIT
      ? unit.rows.slice(0, MAX_LINES_PER_UNIT)
      : unit.rows,
    structures,
    dataQuery,
    locale,
    timePeriods,
  );
  const dimensions = getDimensionsInfo(unit.rows, structures, locale);
  const frequencyValue = dimensions?.find(
    (dimension) => dimension?.id === FrequencyDimension,
  )?.value;

  return {
    rows: unit.rows,
    limitedByRowsAmountTo:
      unit.rows.length > MAX_LINES_PER_UNIT ? MAX_LINES_PER_UNIT : undefined,
    dimensions,
    config: buildChartConfig(
      filterTimePeriodsByFrequency(timePeriods, frequencyValue),
      series,
      styles,
    ),
  };
}

function filterTimePeriodsByFrequency(
  timePeriods: string[],
  frequencyValue?: string,
) {
  if (frequencyValue === Periods.MONTHLY) {
    return timePeriods?.filter((period) => isMonthly(period));
  }
  if (frequencyValue === Periods.QUARTERLY) {
    return timePeriods?.filter((period) => isQuarterly(period));
  }
  if (frequencyValue === Periods.ANNUAL) {
    return timePeriods?.filter((period) => isYearly(period));
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
        dataQuery?.metadata.countryDimension == null
          ? ''
          : buildSerieKeyTitle(
              row,
              [dataQuery?.metadata.countryDimension],
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
  locale: string,
): DimensionInfo[] {
  return (getDimensions(structures)?.dimensions || [])
    .map((dim) => {
      if (dim.id == null) {
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
