import { buildDatasetLastUpdatedMap } from '../build-dataset-dimensions-metadata-map';
import { DeploymentDatasetsResponseData } from '../../models';

function channelDataset(
  resourceId: string,
  lastUpdatedAt?: string | null,
): DeploymentDatasetsResponseData['datasets'][number] {
  return {
    dataset: {
      details: {
        urn: { agencyId: 'ABC', resourceId, version: '1.0.0' },
        dimensions: {},
      },
    },
    last_updated_at: lastUpdatedAt,
  };
}

describe('buildDatasetLastUpdatedMap', () => {
  it('maps short urns to last_updated_at values', () => {
    const data: DeploymentDatasetsResponseData = {
      datasets: [
        channelDataset('CPI', '2025-07-15T00:00:00'),
        channelDataset('GDP', '2024-01-02T10:30:00'),
      ],
    };

    expect(buildDatasetLastUpdatedMap(data)).toEqual({
      'ABC:CPI(1.0.0)': '2025-07-15T00:00:00',
      'ABC:GDP(1.0.0)': '2024-01-02T10:30:00',
    });
  });

  it('skips datasets without last_updated_at', () => {
    const data: DeploymentDatasetsResponseData = {
      datasets: [
        channelDataset('CPI', '2025-07-15T00:00:00'),
        channelDataset('GDP', null),
        channelDataset('BOP'),
      ],
    };

    expect(buildDatasetLastUpdatedMap(data)).toEqual({
      'ABC:CPI(1.0.0)': '2025-07-15T00:00:00',
    });
  });

  it('returns an empty map for an empty dataset list', () => {
    expect(buildDatasetLastUpdatedMap({ datasets: [] })).toEqual({});
  });
});
