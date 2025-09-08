import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { DataMessage } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { ObsColGetter } from '@statgpt/conversation-view/src/types/data-grid/obs-col-getter';
import {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import {
  getDimensions,
  getTimePeriods,
} from '@statgpt/sdmx-toolkit/src/utils/get-dimensions';
import { getLocalizedName } from '@statgpt/sdmx-toolkit/src/utils/get-localized-name';
import { formatNumberBySign } from '@statgpt/shared-toolkit/src/utils/format-numbers';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';
import { defaultFormatNumbers } from '@statgpt/shared-toolkit/src/constants/format-numbers-default';
import {
  getDimRelatedStructures,
  getDimValueLocalizedName,
} from '@statgpt/conversation-view/src/utils/attachments/localized-value';
import { sortPeriods } from '@statgpt/sdmx-toolkit/src/parsers/time-period-parser/period-sorting';
import {
  CELL_PADDING_0,
  DEFAULT_GRID_COLUMN_WITH,
  getChartColumn,
  getMetaDataColumn,
  OBSERVATION_VALUE_CELL_RENDER,
} from '@statgpt/conversation-view/src/constants/grid';
import { MetadataSettings } from '@statgpt/conversation-view/src/models/metadata';
import { localizeTimePeriod } from '@statgpt/conversation-view/src/utils/attachments/time-period';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

export function getColumns(
  structures: StructuralData,
  data: DataMessage,
  locale: string,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  titles?: ConversationViewTitles,
): ColDef[] {
  const dimColumns = getDimensionsColumns(structures, locale);
  const timeColumns = getTimeseriesColumns(
    structures,
    data,
    locale,
    formattingSettings,
    metadataSettings,
    titles,
  );
  return [
    getMetaDataColumn(structures, data?.data, locale, metadataSettings, titles),
    ...dimColumns,
    ...timeColumns,
    getChartColumn(structures, data?.data, locale, void 0, titles),
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
    };
  });
}

//TODO: support availability based building of time columns
export function getTimeseriesColumns(
  structures: StructuralData,
  data: DataMessage,
  locale: string,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  titles?: ConversationViewTitles,
): ColDef[] {
  const timePeriods = getTimePeriods(data);
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
