import { FC } from 'react';
import { Checkbox, CollapsibleBlock } from '@epam/statgpt-ui-components';
import { DownloadDatasetItem } from '../../models/download-dataset-item';

interface Props {
  title: string;
  items: DownloadDatasetItem[];
  selectedUrns: Set<string>;
  onToggle: (urn: string) => void;
  collapsible?: boolean;
  rowsLabel?: string;
}

const DownloadDatasetsBlock: FC<Props> = ({
  title,
  items,
  selectedUrns,
  onToggle,
  collapsible = true,
  rowsLabel = 'rows',
}) => {
  const content = (
    <div className="flex flex-col">
      {items.map((item) => (
        <div key={item.urn} className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Checkbox
              id={item.urn}
              label={item.name}
              checked={selectedUrns.has(item.urn)}
              onChange={onToggle}
            />
          </div>
          <span className="download-row-count">
            {item.rowCount} {rowsLabel}
          </span>
        </div>
      ))}
    </div>
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

  return <CollapsibleBlock title={title}>{content}</CollapsibleBlock>;
};

export default DownloadDatasetsBlock;
