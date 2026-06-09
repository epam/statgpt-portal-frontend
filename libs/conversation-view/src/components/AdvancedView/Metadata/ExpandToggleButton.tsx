'use client';

import { FC } from 'react';
import classNames from 'classnames';
import { IconButton } from '@epam/statgpt-ui-components';
import ChevronSolidDownIcon from '../../../assets/icons/chevron-solid-down.svg';

interface Props {
  isExpanded: boolean;
  onToggle: () => void;
  title?: string;
}

export const ExpandToggleButton: FC<Props> = ({
  isExpanded,
  onToggle,
  title,
}) => (
  <IconButton
    title={title}
    buttonClassName={classNames(
      'border-none p-0 w-6 h-6 shrink-0',
      isExpanded && 'rotate-[180deg]',
    )}
    isBaseIconStyles={false}
    icon={<ChevronSolidDownIcon width={24} height={24} />}
    onClick={onToggle}
  />
);
