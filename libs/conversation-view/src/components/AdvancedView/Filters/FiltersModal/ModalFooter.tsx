'use client';

import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { FC } from 'react';
import { FiltersModalProps } from '../../../../models/filters';
import classNames from 'classnames';
import ClearIcon from '../../../../assets/icons/clear.svg';
import { ConversationViewTitles } from '../../../../models/titles';

interface Props {
  modalProps?: FiltersModalProps;
  onApply: () => void;
  onClearAllFilters: () => void;
  onClose: () => void;
  titles?: ConversationViewTitles;
}
const ModalFooter: FC<Props> = ({
  modalProps,
  onApply,
  onClearAllFilters,
  onClose,
  titles,
}) => {
  return (
    <div
      className={classNames(
        'flex py-4 px-6',
        modalProps?.isShowCancelButton
          ? 'justify-between'
          : 'gap-x-8 flex-row-reverse justify-end sm:flex-col-reverse sm:gap-y-5 items-center',
      )}
    >
      <Button
        iconBefore={
          modalProps?.isShowClearIcon ? <ClearIcon className="w-5 h-5" /> : null
        }
        buttonClassName="text-button-tertiary p-0"
        title={
          modalProps?.isShowClearIcon
            ? (titles?.clearAllFilters ?? 'Clear All Filters')
            : (titles?.clearAll ?? 'Clear All')
        }
        onClick={() => onClearAllFilters()}
      />
      <div className="flex items-center gap-x-3">
        {modalProps?.isShowCancelButton ? (
          <Button
            buttonClassName="text-button-tertiary sm:h8"
            title={titles?.cancel ?? 'Cancel'}
            onClick={onClose}
          />
        ) : null}
        <Button
          buttonClassName={'advanced-view-filters-modal-apply-button'}
          title={titles?.apply ?? 'Apply'}
          onClick={onApply}
        />
      </div>
    </div>
  );
};

export default ModalFooter;
