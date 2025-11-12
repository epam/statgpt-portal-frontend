import { FC, ReactNode } from 'react';
import { CollapsibleBlock, Radio } from '@epam/statgpt-ui-components';
import { IconCircleFilled } from '@tabler/icons-react';
import { DownloadSettingItem } from '../../models/download-settings-item';

interface Props {
  title: string;
  selectedValue: DownloadSettingItem;
  items: DownloadSettingItem[];
  setSelectedValue: (value: DownloadSettingItem) => void;
  infoMessage?: ReactNode;
}

const DownloadOptionBlock: FC<Props> = ({
  title,
  items,
  selectedValue,
  setSelectedValue,
  infoMessage,
}) => {
  return (
    <CollapsibleBlock title={title} value={selectedValue.title}>
      <div className="flex flex-col gap-y-1">
        {items.map((type) => (
          <div className="flex flex-col" key={type.value}>
            <Radio
              id={type.value}
              key={type.value}
              checked={selectedValue.value === type.value}
              label={type.title}
              description={type.description}
              onChange={() => {
                setSelectedValue(type);
              }}
              radioIcon={<IconCircleFilled className="w-3 h-3" />}
            />
          </div>
        ))}
      </div>
      {infoMessage}
    </CollapsibleBlock>
  );
};

export default DownloadOptionBlock;
