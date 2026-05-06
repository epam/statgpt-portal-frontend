import { FC, ReactNode, useEffect } from 'react';
import classNames from 'classnames';
import { CloseButton } from '../CloseButton/CloseButton';
import { AlertDetails } from '../../models/alert';
import { AlertType } from '../../constants/alert';

const ALERT_AUTO_CLOSE_DELAY_MS = 30000;

interface Props {
  alertDetails?: AlertDetails;
  infoIcon?: ReactNode;
  successIcon?: ReactNode;
  errorIcon?: ReactNode;
  onClose?: () => void;
  closeButtonTitle?: string;
  children?: ReactNode;
}

export const Alert: FC<Props> = ({
  alertDetails,
  infoIcon,
  successIcon,
  errorIcon,
  onClose,
  closeButtonTitle,
  children,
}) => {
  const alertType = alertDetails?.type;
  const isInfoOrInProgress =
    alertType === AlertType.IN_PROGRESS || alertType === AlertType.INFO;

  const getAlertIndicatorClass = () => {
    if (isInfoOrInProgress) {
      return 'alert-in-progress';
    }

    if (alertType === AlertType.SUCCESS) {
      return 'alert-success';
    }

    return 'alert-error';
  };

  const alertIcon = isInfoOrInProgress
    ? infoIcon
    : alertType === AlertType.SUCCESS
      ? successIcon
      : alertType === AlertType.ERROR
        ? errorIcon
        : null;
  const alertText = alertDetails?.text;

  useEffect(() => {
    if (!alertDetails || isInfoOrInProgress) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onClose?.();
    }, ALERT_AUTO_CLOSE_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [alertDetails, isInfoOrInProgress, onClose]);

  return (
    <div
      className={classNames(
        'alert alert-shadow fixed bottom-3 right-3 z-10 w-[min(380px,calc(100vw-24px))] max-w-[calc(100vw-24px)]',
        getAlertIndicatorClass(),
      )}
    >
      <div className="alert-content flex items-start">
        {alertIcon && <div className="alert-icon">{alertIcon}</div>}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="alert-title truncate">{alertDetails?.title}</h3>
          {children ??
            (alertText && (
              <div
                className="alert-text whitespace-pre-line break-words"
                title={alertText}
              >
                {alertText}
              </div>
            ))}
        </div>
        <CloseButton title={closeButtonTitle} onClick={onClose} />
      </div>
    </div>
  );
};
