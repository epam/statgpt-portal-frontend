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
  collapsible?: boolean;
}

const DownloadOptionBlock: FC<Props> = ({
  title,
  items,
  selectedValue,
  setSelectedValue,
  infoMessage,
  collapsible = true,
}) => {
  const content = (
    <>
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
              radioIcon={<IconCircleFilled className="size-3" />}
            />
          </div>
        ))}
      </div>
      {infoMessage}
    </>
  );

  if (!collapsible) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center py-4">
          <span>{title}</span>
        </div>
        <div className="pb-4">{content}</div>
      </div>
    );
  }

  return (
    <CollapsibleBlock title={title} value={selectedValue.title}>
      {content}
    </CollapsibleBlock>
  );
};

export default DownloadOptionBlock;
