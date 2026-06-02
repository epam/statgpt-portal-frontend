import {
  DataConstraints,
  DatasetDimensionsMetadataMap,
  Dimension,
  findCodelistByDimension,
  getAvailableCodesFromConstrains,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import { Filter } from '../models/filters';
import { StructureDataMaps } from '../models/structure-data';
import { getNativeFilterIdForSharedFilter } from './multiple-filters';

/**
 * Selected value ids no longer valid under `constraints`: codes in the
 * dimension's codelist but absent from the constraint-available set.
 * Hierarchy-only codes (absent from the codelist) are kept, and empty/missing
 * constraints narrow to nothing — so neither is ever flagged.
 */
export const getIncompatibleSelectedValueIds = (
  filter: Filter,
  dimension: Dimension | undefined,
  structures: StructuralData | undefined,
  constraints: DataConstraints[] | undefined,
  locale?: string,
): Set<string> => {
  const incompatibleIds = new Set<string>();

  if (!dimension || filter.isTimeDimension) {
    return incompatibleIds;
  }

  const selectedValues =
    filter.dimensionValues?.filter((value) => value.isSelectedValue) ?? [];

  if (!selectedValues.length) {
    return incompatibleIds;
  }

  const codeList = findCodelistByDimension(
    structures?.codelists,
    structures?.conceptSchemes,
    dimension,
  );

  if (!codeList?.codes?.length) {
    return incompatibleIds;
  }

  const codelistIds = new Set(codeList.codes.map((code) => code.id));
  const availableIds = new Set(
    getAvailableCodesFromConstrains(
      codeList.codes,
      dimension.id,
      constraints,
      locale,
    ).map((code) => code.id),
  );

  selectedValues.forEach((value) => {
    if (codelistIds.has(value.id) && !availableIds.has(value.id)) {
      incompatibleIds.add(value.id);
    }
  });

  return incompatibleIds;
};

/** Unselects incompatible values across one dataset's filters, skipping the just-changed filter and time dimensions. */
export const cleanIncompatibleDatasetFilters = (
  filters: Filter[],
  dimensions: Dimension[] | undefined,
  structures: StructuralData | undefined,
  constraints: DataConstraints[] | undefined,
  excludeFilterId: string | undefined,
  locale?: string,
): { filters: Filter[]; changed: boolean } => {
  let changed = false;

  const cleaned = filters.map((filter) => {
    if (
      filter.isTimeDimension ||
      (excludeFilterId && filter.id === excludeFilterId)
    ) {
      return filter;
    }

    const dimension = dimensions?.find((dim) => dim.id === filter.id);
    const incompatibleIds = getIncompatibleSelectedValueIds(
      filter,
      dimension,
      structures,
      constraints,
      locale,
    );

    if (!incompatibleIds.size) {
      return filter;
    }

    changed = true;
    return {
      ...filter,
      dimensionValues: filter.dimensionValues?.map((value) =>
        incompatibleIds.has(value.id)
          ? { ...value, isSelectedValue: false }
          : value,
      ),
    };
  });

  return { filters: changed ? cleaned : filters, changed };
};

/** Single-dataset entry point; preserves the just-changed filter's selection. */
export const cleanIncompatibleFilters = (
  filters: Filter[],
  dimensions: Dimension[] | undefined,
  structures: StructuralData | undefined,
  constraints: DataConstraints[] | undefined,
  changedFilter: Filter | undefined,
  locale?: string,
): { filters: Filter[]; changed: boolean } =>
  cleanIncompatibleDatasetFilters(
    filters,
    dimensions,
    structures,
    constraints,
    changedFilter?.id,
    locale,
  );

/**
 * Cross-dataset entry point, over an already-expanded `filtersMap`. Cleans per
 * dataset before shared filters are re-merged, so a merged shared value stays
 * selected while any source dataset still supports it.
 */
export const cleanIncompatibleFiltersMap = (
  filtersMap: Map<string, Filter[]>,
  structureDataMaps: StructureDataMaps | undefined,
  changedFilter: Filter | undefined,
  locale?: string,
  datasetDimensionsMetadataMap?: DatasetDimensionsMetadataMap,
): { filtersMap: Map<string, Filter[]>; changed: boolean } => {
  let changed = false;
  const cleanedMap = new Map<string, Filter[]>();

  filtersMap.forEach((filters, datasetUrn) => {
    const excludeFilterId =
      changedFilter?.filterType === 'shared'
        ? getNativeFilterIdForSharedFilter(
            changedFilter,
            datasetUrn,
            datasetDimensionsMetadataMap,
          )
        : changedFilter?.datasetUrn === datasetUrn
          ? changedFilter.id
          : undefined;
    const result = cleanIncompatibleDatasetFilters(
      filters,
      structureDataMaps?.dimensionsMap?.get(datasetUrn),
      structureDataMaps?.structuresMap?.get(datasetUrn),
      structureDataMaps?.constraintsMap?.get(datasetUrn),
      excludeFilterId,
      locale,
    );

    changed = changed || result.changed;
    cleanedMap.set(datasetUrn, result.filters);
  });

  return { filtersMap: changed ? cleanedMap : filtersMap, changed };
};
