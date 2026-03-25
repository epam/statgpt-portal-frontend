'use client';

import {
  Button,
  LimitMessages,
  useIsMobile,
} from '@epam/statgpt-ui-components';
import { FC } from 'react';
import { FiltersModalProps } from '../../../../models/filters';
import classNames from 'classnames';
import { ConversationViewTitles } from '../../../../models/titles';
import FiltersCounter from '../FiltersCounter/FiltersCounter';

interface Props {
  modalProps?: FiltersModalProps;
  onApply: () => void;
  onClearAllFilters: () => void;
  onClose: () => void;
  titles?: ConversationViewTitles;
  applyDisabled?: boolean;
  timeseriesLength?: number;
  limitMessages?: LimitMessages;
}
const ModalFooter: FC<Props> = ({
  modalProps,
  onApply,
  onClearAllFilters,
  onClose,
  titles,
  applyDisabled,
  timeseriesLength,
  limitMessages,
}) => {
  const isMobile = useIsMobile();
  const isRightAligned = modalProps?.footerActionsPosition === 'right';
  const hasCancelButton = modalProps?.isShowCancelButton;

  const wrapperClasses = hasCancelButton
    ? isRightAligned
      ? 'justify-end'
      : 'justify-start'
    : isRightAligned
      ? 'flex-row items-center justify-between sm:flex-col-reverse sm:gap-y-4'
      : 'gap-x-8 flex-row-reverse items-center justify-between sm:flex-col sm:gap-y-4';

  const buttonsContainerClasses = hasCancelButton
    ? isRightAligned
      ? 'items-center gap-x-8'
      : 'justify-between'
    : isRightAligned
      ? 'flex-row justify-end items-center sm:flex-col-reverse sm:gap-y-4'
      : 'gap-x-8 flex-row-reverse justify-end items-center sm:flex-col-reverse sm:gap-y-4';

  return (
    <div
      className={classNames(
        'flex py-4 px-6 modal-footer-wrapper',
        wrapperClasses,
      )}
    >
      {!hasCancelButton && (
        <FiltersCounter
          timeseriesLength={timeseriesLength}
          limitMessages={limitMessages}
        />
      )}
      <div className={classNames('flex', buttonsContainerClasses)}>
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
    </div>
  );
};

export default ModalFooter;
