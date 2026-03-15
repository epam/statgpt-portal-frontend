import {
  DataConstraints,
  DataMessage,
  getAdditionalColumns,
  getDimensions,
  getLocalizedName,
  getTimePeriods,
  isDaily,
  isMonthly,
  isQuarterly,
  isSemiAnnually,
  isWeekly,
  isYearly,
  sortPeriods,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import {
  defaultFormatNumbers,
  formatNumberBySign,
  FormatNumbersType,
  TimeRange,
} from '@epam/statgpt-shared-toolkit';
import { ObsColGetter } from '../../../types/data-grid/obs-col-getter';
import {
  ColDef,
  ITooltipParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import {
  getDimRelatedStructures,
  getDimValueLocalizedName,
} from '../localized-value';
import {
  CELL_PADDING_0,
  DEFAULT_GRID_COLUMN_WITH,
  getChartColumn,
  getMetaDataColumn,
  GRID_COLUMN_FLEX,
  OBSERVATION_VALUE_CELL_RENDER,
} from '../../../constants/grid';
import { MetadataSettings } from '../../../models/metadata';
import { localizeTimePeriod } from '../time-period';
import { ConversationViewTitles } from '../../../models/titles';
import { PutOnboardingFile } from '../../../types/actions';

export function getColumns(
  structures: StructuralData,
  data: DataMessage,
  locale: string,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  titles?: ConversationViewTitles,
  action?: PutOnboardingFile,
  constraints?: DataConstraints[],
  selectedTimePeriod?: TimeRange,
): ColDef[] {
  const dimColumns = getDimensionsColumns(structures, locale);

  const columns =
    selectedTimePeriod?.startPeriod && selectedTimePeriod.endPeriod
      ? getAdditionalColumns(
          constraints as DataConstraints[],
          selectedTimePeriod,
        )
      : [];

  const timeColumns = getTimeseriesColumns(
    structures,
    data,
    locale,
    formattingSettings,
    metadataSettings,
    titles,
    columns,
  );
  return [
    getMetaDataColumn(
      structures,
      data?.data,
      locale,
      metadataSettings,
      action,
    ),
    ...dimColumns,
    ...timeColumns,
    getChartColumn(structures, data?.data, locale, void 0, action),
  ];
}

export function getDimensionsColumns(
  data: StructuralData,
  locale: string,
): ColDef[] {
  const conceptSchemes = data.conceptSchemes || [];
  const codelists = data.codelists || [];

  const dimensions = getDimensions(data)?.dimensions || [];

  return dimensions.map((dim) => {
    const { codeList, concept } = getDimRelatedStructures(
      dim,
      conceptSchemes,
      codelists,
    );

    const valueGetter = (value: ValueGetterParams) => {
      const { data, colDef } = value;
      const dimensionId = colDef.field;

      return getDimValueLocalizedName(
        dimensions,
        dimensionId,
        codeList,
        data,
        locale,
      );
    };

    return {
      headerName: getLocalizedName(concept, locale),
      field: dim.id,
      colId: dim.id,
      valueGetter,
      ...GRID_COLUMN_FLEX,
      tooltipValueGetter: (p: ITooltipParams) => p.value,
    };
  });
}

export function getTimeseriesColumns(
  structures: StructuralData,
  data: DataMessage,
  locale: string,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  titles?: ConversationViewTitles,
  columns?: string[],
): ColDef[] {
  const timePeriods = getMergedTimePeriods(columns, getTimePeriods(data));
  const obsColGetter: ObsColGetter = (columnId, column) =>
    getDEObservationColumn(
      columnId,
      column || columnId,
      formattingSettings,
      titles,
    );
  return getTimeColumns(
    timePeriods,
    obsColGetter,
    structures,
    locale,
    metadataSettings,
    titles,
  );
}

const getDEObservationColumn = (
  columnId: string,
  name: string,
  formattingSettings = defaultFormatNumbers,
  titles?: ConversationViewTitles,
): ColDef => ({
  headerName: localizeTimePeriod(name, titles),
  colId: columnId,
  field: columnId,
  type: 'numericColumn',
  suppressColumnsToolPanel: true,
  sortable: false,
  width: DEFAULT_GRID_COLUMN_WITH,
  cellClass: ['justify-end', 'cell-with-meta'],
  valueFormatter: (params: ValueFormatterParams) =>
    formatNumberBySign(params.value, formattingSettings),
});

const getTimeColumns = (
  periods: string[],
  obsColGetter: ObsColGetter,
  structures: StructuralData,
  locale: string,
  metadataSettings?: MetadataSettings,
  titles?: ConversationViewTitles,
): ColDef[] => {
  const columns: ColDef[] = [];
  const sortedPeriods = periods.sort((a, b) => sortPeriods(a, b));

  sortedPeriods.forEach((period) => {
    columns.push({
      headerName: period.toString(),
      field: period.toString(),
      ...obsColGetter(period.toString()),
      valueGetter: (params) => {
        return params.data[params.column.getColId()]?.value?.[0]?.value || null;
      },
      cellClass: CELL_PADDING_0,
      cellRenderer: OBSERVATION_VALUE_CELL_RENDER,
      width: DEFAULT_GRID_COLUMN_WITH,
      cellRendererParams: {
        dataSetData: structures,
        locale,
        metadataSettings,
      },
    });
  });

  return columns;
};

const getMergedTimePeriods = (
  generatedPeriods: string[] = [],
  dataPeriods: string[] = [],
): string[] => {
  if (!generatedPeriods.length) {
    return dataPeriods;
  }

  if (!dataPeriods.length) {
    return generatedPeriods;
  }

  const hasYearly = dataPeriods.some((period) => isYearly(period));
  const hasSemiAnnual = dataPeriods.some((period) => isSemiAnnually(period));
  const hasQuarterly = dataPeriods.some((period) => isQuarterly(period));
  const hasMonthly = dataPeriods.some((period) => isMonthly(period));
  const hasWeekly = dataPeriods.some((period) => isWeekly(period));
  const hasDaily = dataPeriods.some((period) => isDaily(period));

  const filteredGeneratedPeriods = generatedPeriods.filter((period) => {
    if (isYearly(period)) {
      return hasYearly;
    }
    if (isSemiAnnually(period)) {
      return hasSemiAnnual;
    }
    if (isQuarterly(period)) {
      return hasQuarterly;
    }
    if (isMonthly(period)) {
      return hasMonthly;
    }
    if (isWeekly(period)) {
      return hasWeekly;
    }
    if (isDaily(period)) {
      return hasDaily;
    }

    return true;
  });

  return Array.from(new Set([...filteredGeneratedPeriods, ...dataPeriods]));
};
