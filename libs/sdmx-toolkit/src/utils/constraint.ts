import {
  DataConstraints,
  MemberSelectionValue,
} from '../models/structural-metadata/constraints';
import { Annotation } from '../models/structural-metadata-base';
import { TimeRange, DataQuery } from '@epam/statgpt-shared-toolkit';
import { getLocalizedName } from './get-localized-name';
import { Code, Codelist } from '../models/structural-metadata/codelist';
import { getFilteredItemsWithParents } from './get-filtered-items';
import { SeriesFilterDto } from '../models';
import { SeriesFilterOperator } from '../types';

export const TIME_PERIOD_END = 'time_period_end';
export const TIME_PERIOD_START = 'time_period_start';
export const TIME_PERIOD = 'TIME_PERIOD';

export const getAnnotationPeriod = (
  annotations: Annotation[] | undefined,
): TimeRange => {
  const start = annotations?.find(
    (annotation) => annotation.id === TIME_PERIOD_START,
  );
  const end = annotations?.find(
    (annotation) => annotation.id === TIME_PERIOD_END,
  );

  const endPeriod = end?.title ? new Date(end?.title) : null;
  const startPeriod = start?.title ? new Date(start?.title) : null;

  return {
    startPeriod,
    endPeriod,
  };
};

const idComparer = (nodeA: Codelist, nodeB: Codelist) =>
  (nodeA.id as string).localeCompare(nodeB.id);

const membersComparer = (
  nodeA: MemberSelectionValue,
  nodeB: MemberSelectionValue,
) => (nodeA.memberValue as string).localeCompare(nodeB.memberValue);

const filterElements = (
  source: Codelist[],
  available: MemberSelectionValue[],
): Codelist[] => {
  const result = new Array(source.length);
  const items = source.map((el, index) => [el, index]);
  items.sort((first, second) =>
    idComparer(first[0] as Codelist, second[0] as Codelist),
  );

  const elements = [...available];
  elements.sort(membersComparer);

  let pos = 0;

  for (const key of items) {
    const item = key[0] as Codelist;
    while (
      pos < elements.length &&
      elements[pos].memberValue.localeCompare(item.id) < 0
    ) {
      pos += 1;
    }

    if (pos < elements.length && elements[pos].memberValue === item.id) {
      result[key[1] as number] = key[0];
    }
  }
  return result.filter((val) => val != null);
};

const isHierarchicalCodes = (codes?: Code[]): boolean => {
  return !!codes?.some((code) => code.parent);
};

export const getAvailableCodesFromConstrains = (
  codes: Codelist[] | undefined,
  dimensionId: string | undefined,
  contentConstraints: DataConstraints[] | undefined,
  locale?: string,
  filters: string[] = [],
): Codelist[] => {
  let availableCodes = codes || [];

  if (isConstraintOnElements(contentConstraints || [], dimensionId || '')) {
    const cubeRegion = (contentConstraints || [])[0].cubeRegions?.find(
      ({ isIncluded }) => isIncluded,
    );

    if (cubeRegion) {
      const keyValues = cubeRegion.memberSelection?.find(
        ({ componentId }) => componentId === dimensionId,
      );

      if (keyValues) {
        availableCodes =
          availableCodes.length === 0
            ? (keyValues.selectionValues || []).map(({ memberValue }) => ({
                id: memberValue,
                name: memberValue,
              }))
            : filterElements(availableCodes, keyValues.selectionValues);
      } else {
        availableCodes = [];
      }
    }
  } else if (filters.length !== 0) {
    availableCodes = availableCodes.filter(({ id }) => filters.includes(id));
  }

  if (isHierarchicalCodes(codes)) {
    availableCodes = getFilteredItemsWithParents(codes, availableCodes);
  }
  return availableCodes?.map((code) => ({
    ...code,
    name: locale ? getLocalizedName(code, locale) : code?.name,
  }));
};

const isConstraintOnElements = (
  contentConstraints: DataConstraints[],
  dimensionId: string,
) =>
  contentConstraints != null &&
  contentConstraints.length > 0 &&
  dimensionId != null;

export const getFiltersDtoFromDataQuery = (
  dataQuery: DataQuery,
): SeriesFilterDto[] => {
  const filters: SeriesFilterDto[] = [];
  dataQuery?.filters?.forEach((filter) => {
    if (filter.componentCode !== TIME_PERIOD) {
      filters.push({
        componentCode: filter.componentCode,
        operator: SeriesFilterOperator.EQUALS,
        value: filter.values.join(','),
      });
    }
  });
  return filters;
};
