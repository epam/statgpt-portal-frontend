import { FC, ReactNode, useEffect } from 'react';
import classNames from 'classnames';
import { Loader } from '../Loader/Loader';
import { CloseButton } from '../CloseButton/CloseButton';
import { AlertDetails } from '../../models/alert';
import { AlertType } from '../../constants/alert';

interface Props {
  alertDetails?: AlertDetails;
  successIcon?: ReactNode;
  errorIcon?: ReactNode;
  onClose?: () => void;
  closeButtonTitle?: string;
}

export const Alert: FC<Props> = ({
  alertDetails,
  successIcon,
  errorIcon,
  onClose,
  closeButtonTitle,
}) => {
  const getAlertIndicatorClass = () => {
    if (alertDetails?.type === AlertType.IN_PROGRESS) {
      return 'alert-in-progress';
    }

    if (alertDetails?.type === AlertType.SUCCESS) {
      return 'alert-success';
    }

    return 'alert-error';
  };

  useEffect(() => {
    if (alertDetails?.type !== AlertType.IN_PROGRESS) {
      setTimeout(() => {
        onClose?.();
      }, 5000);
    }
  }, [alertDetails?.type, onClose]);

  return (
    <div
      className={classNames(
        'alert alert-shadow fixed bottom-3 right-3 z-10',
        getAlertIndicatorClass(),
      )}
    >
      <div className="alert-content flex items-start">
        <div className="alert-icon">
          {alertDetails?.type === AlertType.IN_PROGRESS ? (
            <Loader />
          ) : alertDetails?.type === AlertType.SUCCESS ? (
            successIcon
          ) : (
            errorIcon
          )}
        </div>
        <div className="flex flex-col gap-2 max-w-[300px]">
          <h3 className="truncate">{alertDetails?.title}</h3>
          {alertDetails?.text && (
            <div className="alert-text truncate" title={alertDetails?.text}>
              {alertDetails?.text}
            </div>
          )}
        </div>
        <CloseButton title={closeButtonTitle} onClick={onClose} />
      </div>
    </div>
  );
};
