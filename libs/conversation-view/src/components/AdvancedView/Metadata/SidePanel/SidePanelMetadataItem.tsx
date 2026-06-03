'use client';

import { FC } from 'react';
import classNames from 'classnames';
import { useClampToggle } from '../hooks/useClampToggle';
import { ExpandToggleButton } from '../ExpandToggleButton';

interface Props {
  title?: string;
  value: string;
  attachedKeysTitles?: string[];
  isDimensionGroup?: boolean;
}

export const SidePanelMetadataItem: FC<Props> = ({
  title,
  value,
  attachedKeysTitles,
  isDimensionGroup,
}) => {
  const { valueRef, isExpanded, canToggle, toggle } =
    useClampToggle<HTMLParagraphElement>(value);

  return (
    <div className="flex flex-col gap-1">
      {!isDimensionGroup &&
        attachedKeysTitles?.map((attachedKeyTitle, index) => (
          <div
            key={`${attachedKeyTitle}-${index}`}
            title={attachedKeyTitle}
            className="body-3 text-neutrals-800"
          >
            {attachedKeyTitle}
          </div>
        ))}
      <div className="flex items-center justify-between gap-2 pr-2">
        <p title={title} className="body-3 text-neutrals-800">
          {title}
        </p>
        {canToggle && (
          <ExpandToggleButton isExpanded={isExpanded} onToggle={toggle} />
        )}
      </div>
      <p
        ref={valueRef}
        title={value}
        className={classNames(
          'body-2 break-words text-neutrals-1000',
          !isExpanded && 'line-clamp-4',
        )}
      >
        {value}
      </p>
    </div>
  );
};
