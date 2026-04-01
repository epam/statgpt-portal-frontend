import {
  DatasetDimensionsScheme,
  getDimensionTitle,
  getDimensions,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { ColDef, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import {
  CELL_PADDING_0,
  GRID_COLUMN_FLEX,
  MERGED_DIMENSION_CELL_RENDER,
} from '../../../constants/grid';
import {
  getDimRelatedStructures,
  getDimValueLocalizedName,
} from '../localized-value';
import { GridData } from '../../../types/data-grid/grid-data';
import { ConversationViewTitles } from '../../../models/titles';
import {
  COUNTRY_COL_ID,
  DEFAULT_COUNTRY_COL_TITLE,
  DEFAULT_FREQUENCY_COL_TITLE,
  DEFAULT_INDICATOR_COL_TITLE,
  FREQUENCY_COL_ID,
  INDICATOR_COL_ID,
  INDICATORS_CONCATENATION_SYMBOL,
} from '../../../constants/cross-dataset-grid';

export function getCrossDatasetDimensionsColumns(
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  locale: string,
  titles?: ConversationViewTitles,
): ColDef[] {
  return [
    buildCountryColDef(
      structuresMap,
      datasetDimensionsSchemesMap,
      locale,
      titles,
    ),
    buildIndicatorColDef(
      structuresMap,
      datasetDimensionsSchemesMap,
      locale,
      titles,
    ),
    buildFrequencyColDef(
      structuresMap,
      datasetDimensionsSchemesMap,
      locale,
      titles,
    ),
    ...buildOtherDimensionColDefs(
      structuresMap,
      datasetDimensionsSchemesMap,
      locale,
    ),
  ];
}

function buildCountryColDef(
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  locale: string,
  titles?: ConversationViewTitles,
): ColDef {
  const valueGetter = (value: ValueGetterParams) => {
    const { structures, urn, data } = getCellParams(value, structuresMap);
    const countryDimensionId = datasetDimensionsSchemesMap.get(urn)?.region;
    if (
      data == null ||
      urn == null ||
      structures == null ||
      countryDimensionId == null
    ) {
      return '';
    }

    return getDimensionValue(structures, countryDimensionId, data, locale);
  };

  return dimColDef(
    titles?.countryDimensions || DEFAULT_COUNTRY_COL_TITLE,
    COUNTRY_COL_ID,
    valueGetter,
    structuresMap,
    datasetDimensionsSchemesMap,
    locale,
    titles,
  );
}

function buildIndicatorColDef(
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  locale: string,
  titles?: ConversationViewTitles,
): ColDef {
  const valueGetter = (value: ValueGetterParams) => {
    const { structures, urn, data } = getCellParams(value, structuresMap);
    const indicatorDimensions =
      datasetDimensionsSchemesMap.get(urn)?.indicators;
    if (
      data == null ||
      urn == null ||
      structures == null ||
      indicatorDimensions == null ||
      indicatorDimensions.length === 0
    ) {
      return '';
    }

    const names = indicatorDimensions.map(
      (dimId) => getDimensionValue(structures, dimId, data, locale) || '',
    );
    return names.join(INDICATORS_CONCATENATION_SYMBOL);
  };

  return dimColDef(
    titles?.indicatorDimensions || DEFAULT_INDICATOR_COL_TITLE,
    INDICATOR_COL_ID,
    valueGetter,
    structuresMap,
    datasetDimensionsSchemesMap,
    locale,
    titles,
  );
}

function buildFrequencyColDef(
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  locale: string,
  titles?: ConversationViewTitles,
): ColDef {
  const valueGetter = (value: ValueGetterParams) => {
    const { structures, urn, data } = getCellParams(value, structuresMap);
    const frequencyDimensionId =
      datasetDimensionsSchemesMap.get(urn)?.frequency;
    if (
      data == null ||
      urn == null ||
      structures == null ||
      frequencyDimensionId == null
    ) {
      return '';
    }

    return getDimensionValue(structures, frequencyDimensionId, data, locale);
  };

  return dimColDef(
    titles?.frequency || DEFAULT_FREQUENCY_COL_TITLE,
    FREQUENCY_COL_ID,
    valueGetter,
    structuresMap,
    datasetDimensionsSchemesMap,
    locale,
    titles,
  );
}

function buildOtherDimensionColDefs(
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  locale: string,
): ColDef[] {
  const uniqueOtherDimensionIds = new Set<string>();

  datasetDimensionsSchemesMap.forEach((scheme) => {
    scheme?.other?.forEach((dimensionId) => {
      uniqueOtherDimensionIds.add(dimensionId);
    });
  });

  return Array.from(uniqueOtherDimensionIds).map((dimensionId) =>
    buildOtherDimensionColDef(
      dimensionId,
      structuresMap,
      datasetDimensionsSchemesMap,
      locale,
    ),
  );
}

function buildOtherDimensionColDef(
  dimensionId: string,
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  locale: string,
): ColDef {
  const valueGetter = (value: ValueGetterParams) => {
    const { structures, urn, data } = getCellParams(value, structuresMap);
    const otherDimensions = datasetDimensionsSchemesMap.get(urn)?.other ?? [];

    if (
      data == null ||
      urn == null ||
      structures == null ||
      !otherDimensions.includes(dimensionId)
    ) {
      return '';
    }

    return getDimensionValue(structures, dimensionId, data, locale);
  };

  return dimColDef(
    getOtherDimensionTitle(dimensionId, structuresMap, locale),
    dimensionId,
    valueGetter,
    structuresMap,
    datasetDimensionsSchemesMap,
    locale,
  );
}

function getOtherDimensionTitle(
  dimensionId: string,
  structuresMap: Map<string, StructuralData | undefined>,
  locale: string,
): string {
  for (const structures of structuresMap.values()) {
    if (!structures) {
      continue;
    }

    const dimensions = getDimensions(structures)?.dimensions || [];
    const dimension = dimensions.find((dim) => dim.id === dimensionId);

    if (!dimension) {
      continue;
    }

    return (
      getDimensionTitle(structures.conceptSchemes, dimension, locale) ??
      dimensionId
    );
  }

  return dimensionId;
}

function dimColDef(
  title: string,
  colId: string,
  valueGetter: (value: ValueGetterParams) => string | undefined,
  structuresMap: Map<string, StructuralData | undefined>,
  datasetDimensionsSchemesMap: Map<string, DatasetDimensionsScheme | undefined>,
  locale: string,
  titles?: ConversationViewTitles,
): ColDef {
  return {
    headerName: title,
    field: colId,
    colId: colId,
    valueGetter,
    ...GRID_COLUMN_FLEX,
    cellClass: CELL_PADDING_0,
    cellRenderer: MERGED_DIMENSION_CELL_RENDER,
    tooltipValueGetter: (p: ITooltipParams) => p.value,
    cellRendererParams: {
      structuresMap,
      datasetDimensionsSchemesMap,
      locale,
      titles,
      colId,
    },
  };
}

function getCellParams(
  value: ValueGetterParams,
  structuresMap: Map<string, StructuralData | undefined>,
): {
  data: GridData;
  urn: string;
  structures: StructuralData | undefined;
} {
  const { data } = value;
  const urn = data?.dataset?.urn;
  const structures = urn == null ? undefined : structuresMap.get(urn);
  return {
    data,
    urn,
    structures,
  };
}

export function getDimensionValue(
  structures: StructuralData,
  dimensionId: string,
  data: GridData,
  locale: string,
): string | undefined {
  const conceptSchemes = structures.conceptSchemes || [];
  const codelists = structures.codelists || [];
  const dimensions = getDimensions(structures)?.dimensions || [];
  const dimension = dimensions.find((dim) => dim.id === dimensionId);
  if (dimension == null) {
    return void 0;
  }

  const { codeList } = getDimRelatedStructures(
    dimension,
    conceptSchemes,
    codelists,
  );

  return getDimValueLocalizedName(
    dimensions,
    dimensionId,
    codeList,
    data,
    locale,
  );
}
