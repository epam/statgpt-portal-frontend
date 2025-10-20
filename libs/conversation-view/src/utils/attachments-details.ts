import { isEqual } from 'lodash';
import {
  DataQuery,
  QueryFilter,
  QueryFilterDetails,
} from '@statgpt/shared-toolkit/src/models/data-query';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { ConceptScheme } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/concept-scheme';
import { Codelist } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/codelist';
import { getDateString } from './attachments/time-period';
import { getConcept } from '@statgpt/sdmx-toolkit/src/utils/get-concept';
import { findCodelistByDimension } from '@statgpt/sdmx-toolkit/src/utils/find-codelist-by-dimension';
import { getLocalizedName } from '@statgpt/sdmx-toolkit/src/utils/get-localized-name';
import { QueryFilterType } from '@statgpt/shared-toolkit/src/types/query-filter-type';
import { getTimePeriod } from '@statgpt/shared-toolkit/src/utils/get-time-period';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { getDimensions } from '@statgpt/sdmx-toolkit/src/utils/get-dimensions';
import { AttachmentInfo } from '../models/attachments';

export const getAttachmentInfoList = (
  previousDataQueries: DataQuery[],
  currentDataQueries: DataQuery[],
  datasetStructuresMap: Map<string, StructuralData | undefined>,
  locale: string,
): AttachmentInfo[] => {
  return currentDataQueries?.map((dataQuery) => {
    const previousDataQuery = previousDataQueries?.find(
      (previousDataQuery) => previousDataQuery?.urn === dataQuery?.urn,
    );
    const structures = datasetStructuresMap?.get(dataQuery?.urn);
    const conceptSchemes = structures?.conceptSchemes || [];
    const codelists = structures?.codelists || [];
    const dimensionsList = getDimensions(structures as StructuralData);
    const dimensions = [
      ...(dimensionsList?.dimensions || []),
      ...(dimensionsList?.timeDimensions || []),
    ];

    return {
      datasetName: getLocalizedName(structures?.dataflows?.[0], locale),
      queryFiltersDetails: getUpdatedQueryFiltersDetails(
        getQueryFiltersDetails(
          previousDataQuery?.filters || [],
          dimensions,
          conceptSchemes,
          codelists,
          locale,
        ),
        getQueryFiltersDetails(
          dataQuery?.filters,
          dimensions,
          conceptSchemes,
          codelists,
          locale,
        ),
      ),
    };
  });
};

const getUpdatedQueryFiltersDetails = (
  previousFilters?: QueryFilterDetails[],
  currentFilters?: QueryFilterDetails[],
): QueryFilterDetails[] => {
  const previousFiltersMap = new Map(
    previousFilters?.map((filter) => [filter?.id, filter]),
  );

  return (
    currentFilters?.filter(
      (filterItem) =>
        !isEqual(
          previousFiltersMap?.get(filterItem?.id)?.valuesTitles?.sort(),
          filterItem?.valuesTitles?.sort(),
        ),
    ) || []
  );
};

const getQueryFiltersDetails = (
  filters: QueryFilter[],
  dimensions: Dimension[],
  conceptSchemes: ConceptScheme[],
  codelists: Codelist[],
  locale: string,
): QueryFilterDetails[] => {
  return filters?.map((filter) => {
    const filterDimension = dimensions.find(
      (dimension) => dimension?.id === filter?.componentCode,
    );

    const concept = getConcept(
      filterDimension?.conceptIdentity || '',
      conceptSchemes,
    );
    const codeList = findCodelistByDimension(
      codelists,
      conceptSchemes,
      filterDimension,
    );

    return {
      id: filter?.componentCode,
      title: getLocalizedName(concept, locale),
      valuesTitles:
        filter?.operator === QueryFilterType.BETWEEN
          ? [
              `${getDateString(getTimePeriod(filter?.values?.[0]), locale)} - ${getDateString(getTimePeriod(filter?.values?.[1]), locale)}`,
            ]
          : filter?.values?.map((value) => {
              return (
                getLocalizedName(
                  codeList?.codes?.find((code) => code?.id === value),
                  locale,
                ) || value
              );
            }),
    };
  });
};
