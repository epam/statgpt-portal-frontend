/* eslint-disable @nx/enforce-module-boundaries */
import { FC } from 'react';
import { Alert, AlertDetails } from '@epam/statgpt-ui-components';
import { AttachmentsStyles } from '../../../models/attachments-styles';

interface DownloadAlertProps {
  isOpen?: boolean;
  alertDetails?: AlertDetails;
  attachmentsStyles?: AttachmentsStyles;
  onClose: () => void;
}

export const DownloadAlert: FC<DownloadAlertProps> = ({
  isOpen,
  alertDetails,
  attachmentsStyles,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  const progressWidth =
    alertDetails?.progress && alertDetails.progress.total > 0
      ? `${Math.min(
          100,
          Math.max(
            0,
            (alertDetails.progress.current / alertDetails.progress.total) * 100,
          ),
        )}%`
      : '0%';

  return (
    <Alert
      alertDetails={alertDetails}
      infoIcon={attachmentsStyles?.infoDownloadIcon}
      successIcon={attachmentsStyles?.successDownloadIcon}
      errorIcon={attachmentsStyles?.errorDownloadIcon}
      onClose={onClose}
      closeButtonTitle={attachmentsStyles?.closeTitle || 'Close'}
    >
      <>
        {alertDetails?.text && (
          <div
            className="alert-text whitespace-pre-line break-words"
            title={alertDetails.text}
          >
            {alertDetails.text}
          </div>
        )}
        {alertDetails?.progress && (
          <div className="alert-progress">
            <div
              className="alert-progress-value"
              style={{ width: progressWidth }}
            />
          </div>
        )}
        {alertDetails?.action && (
          <button
            type="button"
            className="alert-action"
            disabled={alertDetails.action.disabled}
            onClick={alertDetails.action.onClick}
            title={alertDetails.action.title}
          >
            {alertDetails.action.icon && (
              <span className="alert-action-icon">
                {alertDetails.action.icon}
              </span>
            )}
            <span className="alert-action-text">
              {alertDetails.action.text}
            </span>
          </button>
        )}
      </>
    </Alert>
  );
};
