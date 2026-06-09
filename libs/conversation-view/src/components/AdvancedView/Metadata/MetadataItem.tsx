'use client';

import { FC, useMemo } from 'react';
import classNames from 'classnames';
import { StructureComponentValue } from '../../../models/structure-component';
import { useClampToggle } from './hooks/useClampToggle';
import { ExpandToggleButton } from './ExpandToggleButton';

interface Props extends StructureComponentValue {
  locale: string;
}

const MetadataItem: FC<Props> = ({
  title,
  value,
  attachedKeysTitles,
  isDimensionGroup,
  locale,
}) => {
  const displayValue = useMemo(
    () =>
      Array.isArray(value)
        ? value
            ?.map((valueItem) =>
              typeof valueItem === 'object' ? valueItem?.[locale] : valueItem,
            )
            ?.join(', ')
        : value,
    [locale, value],
  );

  const { valueRef, isExpanded, canToggle, toggle } =
    useClampToggle<HTMLParagraphElement>(displayValue);

  return (
    <div className="metadata-item">
      {!isDimensionGroup &&
        attachedKeysTitles?.map((attachedKeyTitle) => (
          <div
            title={attachedKeyTitle}
            key={attachedKeyTitle}
            className="metadata-item-key mb-1 pr-3 text-neutrals-800"
          >
            {attachedKeyTitle}
          </div>
        ))}
      <div
        className={classNames(
          'flex items-center',
          canToggle && 'justify-between',
        )}
      >
        <h2 title={title} className="metadata-item-title">
          {title}
        </h2>
        {canToggle && (
          <ExpandToggleButton isExpanded={isExpanded} onToggle={toggle} />
        )}
      </div>
      <p
        title={displayValue}
        className={classNames(
          'metadata-item-value pr-3',
          !isExpanded && 'line-clamp-4',
        )}
        ref={valueRef}
      >
        {displayValue}
      </p>
    </div>
  );
};

export default MetadataItem;
