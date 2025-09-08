'use client';

import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { Dataflow } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/dataflow';
import { getLocalizedName } from '@statgpt/sdmx-toolkit/src/utils/get-localized-name';
import { generateShortUrn } from '@statgpt/sdmx-toolkit/src/utils/urn';
import { Locale } from '@statgpt/shared-toolkit/src/types/locale';
import { IconButton } from '@statgpt/ui-components/src/components/IconButton/IconButton';
import DatasetTab from './DatasetTab';

interface Props {
  datasets?: Dataflow[];
  locale?: string;
  isHideAdvancedViewButton?: boolean;
  openAdvancedViewIcon?: ReactNode;
  selectDataset?: (datasetUrn?: string) => void;
  onOpenAdvancedView?: () => void;
}

const DatasetTabs: FC<Props> = ({
  datasets,
  locale,
  isHideAdvancedViewButton,
  openAdvancedViewIcon,
  selectDataset,
  onOpenAdvancedView,
}) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>();

  useEffect(() => {
    if (!selectedDatasetId && datasets?.[0]) {
      setSelectedDatasetId(datasets[0].id);
      selectDataset?.(
        generateShortUrn(
          datasets[0].id,
          datasets[0].version,
          datasets[0].agencyID,
        ),
      );
    }
  }, [datasets, selectDataset, selectedDatasetId]);

  const onSelectDataset = useCallback(
    (datasetUrn?: string) => {
      setSelectedDatasetId(
        datasets?.find(
          (dataset) =>
            generateShortUrn(
              dataset?.id,
              dataset?.version,
              dataset?.agencyID,
            ) === datasetUrn,
        )?.id,
      );
      selectDataset?.(datasetUrn);
    },
    [datasets, selectDataset],
  );

  return (
    <div
      className={classNames(
        'dataset-tabs flex justify-between items-center w-full',
        isHideAdvancedViewButton && 'hide-advance-button',
      )}
    >
      <div className="flex items-center w-full flex-wrap gap-4 sm:w-[calc(100%-30px)]">
        {datasets?.map((dataset) => (
          <DatasetTab
            key={dataset?.id}
            id={dataset?.id}
            title={getLocalizedName(dataset, locale || Locale.EN)}
            version={dataset?.version}
            agency={dataset?.agencyID}
            isActive={datasets?.length > 1 && selectedDatasetId === dataset?.id}
            isSingleTab={datasets?.length === 1}
            onSelectDataset={onSelectDataset}
          />
        ))}
      </div>
      {!isHideAdvancedViewButton && (
        <IconButton
          buttonClassName={'advanced-view-button'}
          icon={openAdvancedViewIcon}
          onClick={onOpenAdvancedView}
        />
      )}
    </div>
  );
};

export default DatasetTabs;
