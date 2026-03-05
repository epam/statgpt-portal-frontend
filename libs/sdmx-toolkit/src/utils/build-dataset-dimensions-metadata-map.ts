import {
  Dataset,
  DeploymentDatasetsResponseData,
  DatasetDimensionsMetadataMap,
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
