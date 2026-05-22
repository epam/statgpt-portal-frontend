'use client';

import { FC, useState } from 'react';
import classNames from 'classnames';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { Checkbox } from '@epam/statgpt-ui-components';
import { FiltersSearchInput } from './FiltersSearchInput';

interface Props {
  dataQueries: DataQuery[];
  disabledDatasetUrns: Set<string>;
  onToggleDataset: (urn: string, enabled: boolean) => void;
  searchIconSize?: number;
}

const DatasetValuesPanel: FC<Props> = ({
  dataQueries,
  disabledDatasetUrns,
  onToggleDataset,
  searchIconSize,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filtered = dataQueries.filter((q) =>
    (q.title ?? q.urn).toLowerCase().includes(normalizedSearch),
  );

  const enabledCount = dataQueries.length - disabledDatasetUrns.size;

  return (
    <div className="filter-values-container flex h-full min-w-0 flex-1 flex-col py-2 sm:border-0">
      <FiltersSearchInput
        value={searchQuery}
        onChange={(value) => setSearchQuery(value)}
        searchIconSize={searchIconSize}
      />
      <div className="body-2 mt-3 flex min-h-0 flex-1 flex-col overflow-auto">
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
