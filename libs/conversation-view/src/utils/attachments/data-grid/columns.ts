import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { DataMessage } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { ObsColGetter } from '../../../types/data-grid/obs-col-getter';
import {
  ColDef,
  ITooltipParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import {
  getDimensions,
  getTimePeriods,
} from '@statgpt/sdmx-toolkit/src/utils/get-dimensions';
import { getAdditionalColumns } from '@statgpt/sdmx-toolkit/src/utils/get-periods';
import { getLocalizedName } from '@statgpt/sdmx-toolkit/src/utils/get-localized-name';
import { formatNumberBySign } from '@statgpt/shared-toolkit/src/utils/format-numbers';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';
import { defaultFormatNumbers } from '@statgpt/shared-toolkit/src/constants/format-numbers-default';
import {
  getDimRelatedStructures,
  getDimValueLocalizedName,
} from '../localized-value';
import { sortPeriods } from '@statgpt/sdmx-toolkit/src/parsers/time-period-parser/period-sorting';
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
import { DataConstraints } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/constraints';
import { TimeRange } from '@statgpt/shared-toolkit/src';
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
      titles,
      action,
    ),
    ...dimColumns,
    ...timeColumns,
    getChartColumn(structures, data?.data, locale, void 0, titles, action),
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
  const timePeriods = columns?.length ? columns : getTimePeriods(data);
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
        titles,
      },
    });
  });

  return columns;
};
