'use client';

import { FC } from 'react';
import classNames from 'classnames';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { IconButton } from '@epam/statgpt-ui-components';
import ClearIcon from '../../../../../assets/icons/clear.svg';
import { useConversationViewStyles } from '../../../../../context/ConversationViewStylesContext';

interface Props {
  dataQueries: DataQuery[];
  disabledDatasetUrns: Set<string>;
  isSelected: boolean;
  onSelect: () => void;
  onClearAll: () => void;
}

const DatasetSelectorFacet: FC<Props> = ({
  dataQueries,
  disabledDatasetUrns,
  isSelected,
  onSelect,
  onClearAll,
}) => {
  const { titles } = useConversationViewStyles();
  const enabledCount = dataQueries.length - disabledDatasetUrns.size;
  const hasClear = disabledDatasetUrns.size > 0;

  return (
    <div
      className={classNames(
        'flex justify-between items-center p-2 hover:bg-hues-100 py-2',
        'filters-facet-item cursor-pointer',
        isSelected && 'bg-hues-100',
      )}
      onClick={onSelect}
    >
      <h3 className="w-full min-w-0 flex-1 truncate" title="Dataset">
        <span className="truncate">Dataset</span>
      </h3>
      <div className="ml-2 flex items-center gap-2 text-neutrals-800">
        <span className="px-2 text-center filters-facet-item-counter">
          {`${enabledCount}/${dataQueries.length}`}
        </span>
        {hasClear && (
          <div className="filters-facet-item-settings flex items-center gap-2">
            <IconButton
              buttonClassName="text-button-tertiary w-4 h-4 border-0 p-0 filters-facet-item-icon"
              icon={<ClearIcon width={16} height={16} />}
              title={titles?.reset ?? 'Reset'}
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export { DatasetSelectorFacet };
