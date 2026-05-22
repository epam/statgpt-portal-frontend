'use client';

import { FC, useState } from 'react';
import classNames from 'classnames';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { Checkbox } from '@epam/statgpt-ui-components';
import { IconSearch } from '@tabler/icons-react';
import { useConversationViewStyles } from '../../../../../context/ConversationViewStylesContext';

interface Props {
  dataQueries: DataQuery[];
  disabledDatasetUrns: Set<string>;
  onToggleDataset: (urn: string, enabled: boolean) => void;
}

const DatasetValuesPanel: FC<Props> = ({
  dataQueries,
  disabledDatasetUrns,
  onToggleDataset,
}) => {
  const { titles } = useConversationViewStyles();
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filtered = dataQueries.filter((q) =>
    (q.title ?? q.urn).toLowerCase().includes(normalizedSearch),
  );

  const enabledCount = dataQueries.length - disabledDatasetUrns.size;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 relative">
        <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-neutrals-500 w-4 h-4" />
        <input
          type="text"
          className="filters-search-input w-full pl-8"
          placeholder={titles?.search ?? 'Search'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {filtered.map((q) => {
          const isChecked = !disabledDatasetUrns.has(q.urn);
          const isLastEnabled = isChecked && enabledCount === 1;
          return (
            <div
              key={q.urn}
              className={classNames(
                'py-1',
                isLastEnabled && 'opacity-50 pointer-events-none',
              )}
            >
              <Checkbox
                id={q.urn}
                label={q.title ?? q.urn}
                checked={isChecked}
                disabled={isLastEnabled}
                onChange={(id, checked) => onToggleDataset(q.urn, !!checked)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { DatasetValuesPanel };
