import {
  DataConstraints,
  Dimension,
  findCodelistByDimension,
  generateShortUrn,
  getAvailableCodesFromConstrains,
  getKeyFromUrn,
  SeriesFilterDto,
  StructuralData,
  StructuralMetaData,
  StructureItemBase,
  TIME_PERIOD,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { Filter, FiltersProps } from '../models/filters';
import { getDatasetFilters, getFiltersPreselectedByDataQuery } from './filters';
import { getSeriesFilterDto } from './get-series-filters';
import { normalizeConstraintFilters } from './normalize-constraint-filters';
import {
  buildRequestCacheKey,
  getCachedRequestResult,
  isRequestCached,
} from './request-cache';

export const getCodelistUrnForDatasetFilter = (
  filter: Filter,
  dimensions?: Dimension[],
  structures?: StructuralData,
): string | undefined => {
  const dimension = dimensions?.find((d) => d.id === filter.id);
  if (!dimension) return undefined;

  const localEnumerationUrn = getKeyFromUrn(
    dimension.localRepresentation?.enumeration,
  );
  if (localEnumerationUrn) {
    return localEnumerationUrn;
  }

  const codelist = findCodelistByDimension(
    structures?.codelists,
    structures?.conceptSchemes,
    dimension,
  );

  return codelist
    ? (getKeyFromUrn(codelist.urn) ??
        generateShortUrn(codelist.id, codelist.version, codelist.agencyID))
    : undefined;
};

export const getSingleDatasetConstraintFilters = (
  filters: Filter[],
): SeriesFilterDto[] =>
  normalizeConstraintFilters(
    getSeriesFilterDto(filters).filter(
      (filter) => filter.componentCode !== TIME_PERIOD,
    ),
  );

export const getSingleDatasetConstraintsRequest = (
  actions: FiltersProps['actions'] | undefined,
  attachmentUrn: string,
  filters: Filter[],
): {
  request: Promise<StructuralMetaData | undefined>;
  shouldTrackLoading: boolean;
} => {
  const constraintFilters = getSingleDatasetConstraintFilters(filters);
  const getConstraints = actions?.getConstraints;

  if (!getConstraints) {
    return {
      request: Promise.resolve(undefined),
      shouldTrackLoading: false,
    };
  }

  const cacheKey = buildRequestCacheKey(attachmentUrn, constraintFilters);

  return {
    request: getCachedRequestResult(getConstraints, cacheKey, () =>
      getConstraints(attachmentUrn, constraintFilters),
    ),
    shouldTrackLoading: !isRequestCached(getConstraints, cacheKey),
  };
};

export const getSingleDatasetFiltersFilledByConstraints = ({
  dimensions,
  structures,
  structureDimensions,
  locale,
  constraints,
}: {
  dimensions?: Dimension[];
  structures?: StructuralData;
  structureDimensions?: StructureItemBase[];
  locale?: string;
  constraints?: DataConstraints[];
}): Filter[] => {
  const datasetFilters = getDatasetFilters(
    dimensions,
    structures,
    structureDimensions,
    locale,
  );
  const filledDimensions = dimensions?.map((dimension) => {
    const codeList = findCodelistByDimension(
      structures?.codelists,
      structures?.conceptSchemes,
      dimension,
    );
    const availableTerms = getAvailableCodesFromConstrains(
      codeList?.codes,
      dimension.id,
      constraints,
      locale,
    );
    return {
      ...dimension,
      dimensionValues: availableTerms,
    };
  });

  return datasetFilters.map((filter) => {
    const dimensionValues =
      filledDimensions?.find((dim) => dim.id === filter.id)?.dimensionValues ||
      [];
    return {
      ...filter,
      dimensionValues,
    };
  });
};

export const getSingleDatasetFiltersPreselectedByDataQuery = ({
  dimensions,
  structures,
  structureDimensions,
  locale,
  constraints,
  dataQuery,
}: {
  dimensions?: Dimension[];
  structures?: StructuralData;
  structureDimensions?: StructureItemBase[];
  locale?: string;
  constraints?: DataConstraints[];
  dataQuery?: DataQuery;
}): Filter[] =>
  getFiltersPreselectedByDataQuery(
    getSingleDatasetFiltersFilledByConstraints({
      dimensions,
      structures,
      structureDimensions,
      locale,
      constraints,
    }),
    dataQuery,
    constraints,
  );
