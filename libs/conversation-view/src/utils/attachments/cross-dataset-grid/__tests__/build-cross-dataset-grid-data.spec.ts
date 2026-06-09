import { buildCrossDatasetGridData } from '../build-cross-dataset-grid-data';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { DataMessage, StructuralData } from '@epam/statgpt-sdmx-toolkit';

const BASE_METADATA = {
  countryDimension: 'REF_AREA',
  indicatorDimensions: [],
};

describe('buildCrossDatasetGridData', () => {
  it('does not access dataMessagesMap for disabled datasets', () => {
    const enabledUrn = 'urn:enabled';
    const disabledUrn = 'urn:disabled';

    const accessedKeys: string[] = [];
    class TrackingMap<K, V> extends Map<K, V> {
      get(key: K): V | undefined {
        accessedKeys.push(key as unknown as string);
        return super.get(key);
      }
    }

    const dataMessagesMap = new TrackingMap<string, DataMessage | null>([
      [enabledUrn, null],
      [disabledUrn, null],
    ]);

    buildCrossDatasetGridData(
      new Map<string, StructuralData | undefined>(),
      dataMessagesMap,
      [
        { urn: enabledUrn, metadata: BASE_METADATA },
        { urn: disabledUrn, disabled: true, metadata: BASE_METADATA },
      ],
      'en',
    );

    expect(accessedKeys).not.toContain(disabledUrn);
  });
});
