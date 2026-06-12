import {
  Dataset,
  DeploymentDatasetsResponseData,
  DatasetDimensionsMetadataMap,
  DatasetLastUpdatedMap,
} from '../models';
import { generateShortUrn } from './urn';

function datasetToShortUrn(dataset: Dataset): string {
  const { urn } = dataset.details;
  return generateShortUrn(urn.resourceId, urn.version, urn.agencyId);
}

export function buildDatasetDimensionsMetadataMap(
  data: DeploymentDatasetsResponseData,
): DatasetDimensionsMetadataMap {
  const map: DatasetDimensionsMetadataMap = {};

  for (const cd of data.datasets) {
    const dataset = cd.dataset;
    const urn = datasetToShortUrn(dataset);

    map[urn] = dataset.details.dimensions;
  }

  return map;
}

export function buildDatasetLastUpdatedMap(
  data: DeploymentDatasetsResponseData,
): DatasetLastUpdatedMap {
  const map: DatasetLastUpdatedMap = {};

  for (const cd of data.datasets) {
    if (cd.last_updated_at) {
      map[datasetToShortUrn(cd.dataset)] = cd.last_updated_at;
    }
  }

  return map;
}
