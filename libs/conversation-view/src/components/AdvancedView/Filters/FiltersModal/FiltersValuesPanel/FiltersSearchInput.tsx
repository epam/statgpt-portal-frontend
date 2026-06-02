'use client';

import { FC, useState } from 'react';
import classNames from 'classnames';
import { InputWithIcon } from '@epam/statgpt-ui-components';
import { IconSearch } from '@tabler/icons-react';
import { useConversationViewStyles } from '../../../../../context/ConversationViewStylesContext';
import { useConversationViewFeatureToggles } from '../../../../../context/ConversationViewFeatureTogglesContext';

const MIN_SEARCH_CHARS = 2;

interface Props {
  value: string;
  onChange: (value: string) => void;
  searchIconSize?: number;
}

const FiltersSearchInput: FC<Props> = ({ value, onChange, searchIconSize }) => {
  const { titles } = useConversationViewStyles();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const [isInputFocused, setIsInputFocused] = useState(false);

  const normalizedValue = value.trim().toLowerCase();
  const showCaption =
    isCrossDatasetModeOn &&
    isInputFocused &&
    normalizedValue.length < MIN_SEARCH_CHARS;

  return (
    <>
      <InputWithIcon
        inputId="filters-search-input"
        containerClasses="gap-2 items-center filters-search-input"
        cssClass="filters-search-input-text"
        placeholder={titles?.searchPlaceholder ?? 'Search'}
        value={value}
        onChange={onChange}
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
        iconBeforeInput={
          <IconSearch
            width={searchIconSize}
            height={searchIconSize}
            className="text-primary"
          />
        }
      />
      {isCrossDatasetModeOn && (
        <span
          className={classNames('caption text-neutrals-800 mt-1', {
            invisible: !showCaption,
          })}
        >
          {titles?.searchMinCharsCaption ??
            'Enter at least 2 characters to start searching'}
        </span>
      )}
    </>
  );
};

export { FiltersSearchInput };
