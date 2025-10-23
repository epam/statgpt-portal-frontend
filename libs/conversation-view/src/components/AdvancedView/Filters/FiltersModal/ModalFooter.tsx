'use client';

import { Button, useIsMobile } from '@epam/statgpt-ui-components';
import classNames from 'classnames';
import { FC } from 'react';
import { FiltersModalProps } from '../../../../models/filters';
import { ConversationViewTitles } from '../../../../models/titles';

interface Props {
  modalProps?: FiltersModalProps;
  onApply: () => void;
  onClearAllFilters: () => void;
  onClose: () => void;
  titles?: ConversationViewTitles;
  applyDisabled?: boolean;
}
const ModalFooter: FC<Props> = ({
  modalProps,
  onApply,
  onClearAllFilters,
  onClose,
  titles,
  applyDisabled,
}) => {
  const isMobile = useIsMobile();
  return (
    <div
      className={classNames(
        'flex py-4 px-6',
        modalProps?.isShowCancelButton
          ? 'justify-between'
          : 'gap-x-8 flex-row-reverse justify-end sm:flex-col-reverse sm:gap-y-4 items-center',
        'modal-footer-wrapper',
      )}
    >
      <Button
        iconBefore={isMobile ? modalProps?.resetIcon : undefined}
        buttonClassName="text-button-tertiary p-0"
        title={
          modalProps?.isShowClearIcon
            ? (titles?.clearAllFilters ?? 'Clear All Filters')
            : (titles?.clearAll ?? 'Clear All')
        }
        onClick={() => onClearAllFilters()}
        isSmallButton={isMobile}
      />
      <div className="flex items-center gap-x-3">
        {modalProps?.isShowCancelButton ? (
          <Button
            buttonClassName="text-button-tertiary sm:h8"
            title={titles?.cancel ?? 'Cancel'}
            onClick={onClose}
            isSmallButton={isMobile}
          />
        ) : null}
        <Button
          buttonClassName={'advanced-view-filters-modal-apply-button'}
          title={titles?.apply ?? 'Apply'}
          onClick={onApply}
          isSmallButton={isMobile}
          disabled={applyDisabled}
        />
      </div>
    </div>
  );
};

export default ModalFooter;
