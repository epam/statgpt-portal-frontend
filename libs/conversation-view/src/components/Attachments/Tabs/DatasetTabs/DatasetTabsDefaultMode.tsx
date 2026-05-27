'use client';

import { generateShortUrn, getLocalizedName } from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';
import DatasetTab from './DatasetTab';
import type { DatasetTabsProps } from './DatasetTabs';
import { useAdvancedView } from '../../../../context/AdvancedViewContext';

const DatasetTabsDefaultMode: FC<DatasetTabsProps> = ({
  datasets,
  locale,
  initialSelectedDatasetUrn,
  selectDataset,
}) => {
  const { isOpenedAdvancedView } = useAdvancedView();
  const [selectedDatasetUrn, setSelectedDatasetUrn] = useState<string>();

  useEffect(() => {
    if (!initialSelectedDatasetUrn && !selectedDatasetUrn && datasets?.[0]) {
      const datasetUrn = generateShortUrn(
        datasets[0].id,
        datasets[0].version,
        datasets[0].agencyID,
      );
      setSelectedDatasetUrn(datasetUrn);
      selectDataset?.(datasetUrn);
    } else if (
      initialSelectedDatasetUrn &&
      initialSelectedDatasetUrn !== selectedDatasetUrn
    ) {
      setSelectedDatasetUrn(initialSelectedDatasetUrn);
      selectDataset?.(initialSelectedDatasetUrn);
    }
  }, [datasets, selectDataset, initialSelectedDatasetUrn, selectedDatasetUrn]);

  const onSelectDataset = useCallback(
    (datasetUrn?: string) => {
      setSelectedDatasetUrn(datasetUrn);
      selectDataset?.(datasetUrn);
    },
    [selectDataset],
  );

  return (
    <div
      className={classNames(
        'dataset-tabs flex w-full items-center justify-between',
        isOpenedAdvancedView && 'hide-advance-button',
      )}
    >
      <div className="flex w-full items-center gap-4 overflow-y-auto sm:w-[calc(100%-30px)]">
        {datasets?.map((dataset) => (
          <DatasetTab
            key={dataset?.id}
            id={dataset?.id}
            title={getLocalizedName(dataset, locale || Locale.EN)}
            version={dataset?.version}
            agency={dataset?.agencyID}
            isActive={
              datasets?.length > 1 &&
              selectedDatasetUrn ===
                generateShortUrn(
                  dataset?.id,
                  dataset?.version,
                  dataset?.agencyID,
                )
            }
            isSingleTab={datasets?.length === 1}
            onSelectDataset={onSelectDataset}
          />
        ))}
      </div>
    </div>
  );
};

export default DatasetTabsDefaultMode;
