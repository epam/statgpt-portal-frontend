/* eslint-disable @nx/enforce-module-boundaries */
import { useCallback } from 'react';
import { AlertDetails, AlertType } from '@epam/statgpt-ui-components';
import { DownloadRequestConfig } from '@statgpt/download-panel/src/models/download-request';
import { AttachmentsStyles } from '../../../models/attachments-styles';

interface UseDownloadAlertDetailsParams {
  attachmentsStyles?: AttachmentsStyles;
  onCancel: () => void;
  onRetry: () => void;
}

export const useDownloadAlertDetails = ({
  attachmentsStyles,
  onCancel,
  onRetry,
}: UseDownloadAlertDetailsParams) => {
  const getDownloadStartedText = useCallback(
    (request: DownloadRequestConfig) =>
      attachmentsStyles?.downloadTitles?.downloadStartedText?.(
        request.dataFormatTitle,
      ) ?? `Preparing ${request.dataFormatTitle} file.`,
    [attachmentsStyles?.downloadTitles],
  );

  const getDownloadInProgressTitle = useCallback(
    (current: number, total: number) =>
      attachmentsStyles?.downloadTitles?.downloadInProgressTitle?.(
        current,
        total,
      ) ?? `Downloading file ${current} of ${total}`,
    [attachmentsStyles?.downloadTitles],
  );

  const getDownloadInProgressText = useCallback(
    (datasetName: string, dataFormat: string) =>
      attachmentsStyles?.downloadTitles?.downloadInProgressText?.(
        datasetName,
        dataFormat,
      ) ?? `${datasetName} \u00B7 ${dataFormat}`,
    [attachmentsStyles?.downloadTitles],
  );

  const getDownloadSuccessTitle = useCallback(
    (request: DownloadRequestConfig) => {
      if (request.items.length > 1) {
        return (
          attachmentsStyles?.downloadTitles?.downloadSuccessMultipleTitle?.(
            request.items.length,
          ) ?? `${request.items.length} files downloaded`
        );
      }

      return (
        attachmentsStyles?.downloadTitles?.downloadSuccessTitle?.(
          request.dataFormatTitle,
        ) ?? `${request.dataFormatTitle} file downloaded`
      );
    },
    [attachmentsStyles?.downloadTitles],
  );

  const getDownloadSuccessText = useCallback(
    (request: DownloadRequestConfig) => {
      if (request.items.length > 1) {
        return (
          attachmentsStyles?.downloadTitles?.downloadSuccessMultipleText?.(
            request.items.length,
          ) ?? `${request.items.length} files successfully downloaded`
        );
      }

      const [item] = request.items;
      return (
        attachmentsStyles?.downloadTitles?.downloadSuccessText?.(
          item.fileName,
          item.rowCount,
        ) ?? `${item.fileName} \u00B7 ${item.rowCount} rows`
      );
    },
    [attachmentsStyles?.downloadTitles],
  );

  const getDownloadFailedText = useCallback(
    (request: DownloadRequestConfig) => {
      if (request.items.length > 1) {
        return (
          attachmentsStyles?.downloadTitles?.downloadFailedMultipleText?.(
            request.items.length,
          ) ?? `${request.items.length} datasets could not be exported`
        );
      }

      const [item] = request.items;
      return (
        attachmentsStyles?.downloadTitles?.downloadFailedText?.(item.name) ??
        `${item.name} could not be exported`
      );
    },
    [attachmentsStyles?.downloadTitles],
  );

  const getStartedAlertDetails = useCallback(
    (request: DownloadRequestConfig): AlertDetails => ({
      type: AlertType.INFO,
      title:
        attachmentsStyles?.downloadTitles?.downloadStartedTitle ??
        'Download started',
      text: getDownloadStartedText(request),
      action: {
        text:
          attachmentsStyles?.downloadTitles?.downloadCancelActionText ??
          attachmentsStyles?.downloadTitles?.cancel ??
          'Cancel',
        icon: attachmentsStyles?.downloadInProgressActionIcon,
        onClick: onCancel,
      },
    }),
    [
      attachmentsStyles?.downloadInProgressActionIcon,
      attachmentsStyles?.downloadTitles,
      getDownloadStartedText,
      onCancel,
    ],
  );

  const getInProgressAlertDetails = useCallback(
    (
      request: DownloadRequestConfig,
      currentFileNumber: number,
      completedCount: number,
      datasetName: string,
    ): AlertDetails => ({
      type: AlertType.IN_PROGRESS,
      title: getDownloadInProgressTitle(
        currentFileNumber,
        request.items.length,
      ),
      text: getDownloadInProgressText(datasetName, request.dataFormatTitle),
      progress: {
        current: completedCount,
        total: request.items.length,
      },
      action: {
        text:
          attachmentsStyles?.downloadTitles?.downloadCancelActionText ??
          attachmentsStyles?.downloadTitles?.cancel ??
          'Cancel',
        icon: attachmentsStyles?.downloadInProgressActionIcon,
        onClick: onCancel,
      },
    }),
    [
      attachmentsStyles?.downloadInProgressActionIcon,
      attachmentsStyles?.downloadTitles,
      getDownloadInProgressText,
      getDownloadInProgressTitle,
      onCancel,
    ],
  );

  const getSuccessAlertDetails = useCallback(
    (request: DownloadRequestConfig): AlertDetails => ({
      type: AlertType.SUCCESS,
      title: getDownloadSuccessTitle(request),
      text: getDownloadSuccessText(request),
    }),
    [getDownloadSuccessText, getDownloadSuccessTitle],
  );

  const getErrorAlertDetails = useCallback(
    (request: DownloadRequestConfig): AlertDetails => ({
      type: AlertType.ERROR,
      title:
        attachmentsStyles?.downloadTitles?.downloadFailedTitle ??
        'Download failed',
      text: getDownloadFailedText(request),
      action: {
        text:
          attachmentsStyles?.downloadTitles?.downloadRetryActionText ??
          'Retry download',
        icon: attachmentsStyles?.downloadErrorActionIcon,
        onClick: onRetry,
      },
    }),
    [
      attachmentsStyles?.downloadErrorActionIcon,
      attachmentsStyles?.downloadTitles,
      getDownloadFailedText,
      onRetry,
    ],
  );

  return {
    getStartedAlertDetails,
    getInProgressAlertDetails,
    getSuccessAlertDetails,
    getErrorAlertDetails,
  };
};
