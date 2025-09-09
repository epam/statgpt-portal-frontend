import { FC, ReactNode, useMemo } from 'react';
import { Dropdown } from '@statgpt/ui-components/src/components/Dropdown/Dropdown';
import { DropdownItem } from '@statgpt/ui-components/src/models/dropdown-item';
import { DownloadType as DownloadTypeOptions } from '@statgpt/sdmx-toolkit/src/types/files';
import { DownloadTypeTrigger } from './DownloadTypeTrigger';
import { DownloadTitles } from '@statgpt/download-panel/src/models/titles';

interface Props {
  icon?: ReactNode;
  title?: string;
  showChevronIcon?: boolean;
  downloadTitles?: DownloadTitles;
  onDownloadTypeSelect: (type: string) => void;
}

export const DownloadType: FC<Props> = ({
  icon,
  title,
  showChevronIcon,
  downloadTitles,
  onDownloadTypeSelect,
}) => {
  const items: DropdownItem[] = useMemo(() => {
    return [
      {
        key: DownloadTypeOptions.DATA_IN_TABLE,
        title: downloadTitles?.partialDataset || 'Data in table',
      },
      {
        key: DownloadTypeOptions.FULL_DATASET,
        title: downloadTitles?.fullDataset || 'Full dataset',
      },
    ];
  }, [downloadTitles]);

  const onOptionSelect = (type: string) => {
    onDownloadTypeSelect(type);
  };

  return (
    <div>
      <Dropdown
        containerClassName="download-type"
        triggerButton={
          <DownloadTypeTrigger
            icon={icon}
            title={title}
            showChevronIcon={showChevronIcon}
          />
        }
        options={items}
        openedClassName="download-type-opened"
        onOptionSelect={onOptionSelect}
      />
    </div>
  );
};
