import { getLocalizedName, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { ColDef, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import { GRID_COLUMN_FLEX } from '../../../constants/grid';
import { ConversationViewTitles } from '../../../models/titles';

const DEFAULT_DATASET_COL_TITLE = 'Dataset';
const DATASET_COL_ID = 'dataset_name';
const DEFAULT_AGENCY_COL_TITLE = 'Agency';
const AGENCY_COL_ID = 'agency';

export function getCrossDsDatasetInfoColumns(
  structuresMap: Map<string, StructuralData | undefined>,
  locale: string,
  titles?: ConversationViewTitles,
): ColDef[] {
  return [
    buildAgencyColDef(structuresMap, titles),
    buildDatasetColDef(structuresMap, locale, titles),
  ];
}

function buildDatasetColDef(
  structuresMap: Map<string, StructuralData | undefined>,
  locale: string,
  titles?: ConversationViewTitles,
): ColDef {
  const valueGetter = (params: ValueGetterParams) => {
    const urn = params.data?.dataset?.urn;
    if (urn == null) {
      return '';
    }
    const structures = structuresMap.get(urn);
    const dataflow = structures?.dataflows?.[0];
    return getLocalizedName(dataflow, locale) || '';
  };

  return {
    headerName: titles?.dataset || DEFAULT_DATASET_COL_TITLE,
    field: DATASET_COL_ID,
    colId: DATASET_COL_ID,
    valueGetter,
    ...GRID_COLUMN_FLEX,
    tooltipValueGetter: (p: ITooltipParams) => p.value,
  };
}

function buildAgencyColDef(
  structuresMap: Map<string, StructuralData | undefined>,
  titles?: ConversationViewTitles,
): ColDef {
  const valueGetter = (params: ValueGetterParams) => {
    const urn = params.data?.dataset?.urn;
    if (urn == null) {
      return '';
    }
    const structures = structuresMap.get(urn);
    const dataflow = structures?.dataflows?.[0];
    return dataflow?.agencyID || '';
  };

  return {
    headerName: titles?.agency || DEFAULT_AGENCY_COL_TITLE,
    field: AGENCY_COL_ID,
    colId: AGENCY_COL_ID,
    valueGetter,
    ...GRID_COLUMN_FLEX,
    tooltipValueGetter: (p: ITooltipParams) => p.value,
  };
}
