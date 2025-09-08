'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { IconButton } from '@statgpt/ui-components/src/components/IconButton/IconButton';
import ChevronSolidDownIcon from '@statgpt/conversation-view/src/assets/icons/chevron-solid-down.svg';
import { StructureComponentValue } from '@statgpt/conversation-view/src/models/structure-component';

const MetadataItem: FC<StructureComponentValue> = ({
  title,
  value,
  attachedKeysTitles,
}) => {
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [isShowIcon, setShowIcon] = useState<boolean>(false);
  const valueContainerRef = useRef<HTMLDivElement>(null);

  const onIconClick = useCallback(() => {
    if (isShowIcon) {
      setIsItemOpen((prev) => !prev);
    }
  }, [setIsItemOpen, isShowIcon]);

  const getMetadataItemValue = useCallback(
    () => (Array.isArray(value) ? value.join(', ') : value),
    [value],
  );

  useEffect(() => {
    if (valueContainerRef?.current) {
      setShowIcon(
        valueContainerRef?.current?.scrollHeight >
          valueContainerRef?.current?.offsetHeight,
      );
    }
  }, [valueContainerRef]);

  return (
    <div className="metadata-item">
      {attachedKeysTitles?.map((attachedKeyTitle) => (
        <div
          title={attachedKeyTitle}
          key={attachedKeyTitle}
          className="metadata-item-key pr-3 mb-1 text-neutrals-800"
        >
          {attachedKeyTitle}
        </div>
      ))}
      <div
        className={classNames(
          'flex items-center',
          isShowIcon && 'justify-between',
        )}
      >
        <h2 title={title} className="metadata-item-title">
          {title}
        </h2>
        {isShowIcon && (
          <IconButton
            buttonClassName={classNames(
              'border-none p-0 w-6 h-6',
              isItemOpen ? 'rotate-[180deg]' : '',
            )}
            icon={<ChevronSolidDownIcon />}
            onClick={onIconClick}
          />
        )}
      </div>
      <p
        title={getMetadataItemValue()}
        className={classNames(
          'metadata-item-value pr-3',
          !isItemOpen && 'line-clamp-4',
        )}
        ref={valueContainerRef}
      >
        {getMetadataItemValue()}
      </p>
    </div>
  );
};

export default MetadataItem;
