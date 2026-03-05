import {
  Dataset,
  DeploymentDatasetsResponseData,
  UrnDimensionsIndex,
} from '../models';
import { generateShortUrn } from './urn';

function datasetToShortUrn(dataset: Dataset): string {
  const { urn } = dataset.details;
  return generateShortUrn(urn.resourceId, urn.version, urn.agencyId);
}

export function buildUrnDimensionsIndex(
  data: DeploymentDatasetsResponseData,
): UrnDimensionsIndex {
  const index: UrnDimensionsIndex = {};

  for (const cd of data.datasets) {
    const dataset = cd.dataset;
    const urn = datasetToShortUrn(dataset);

    index[urn] = dataset.details.dimensions;
  }

  return index;
}
