/* eslint-disable @nx/enforce-module-boundaries */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertDetails } from '@epam/statgpt-ui-components';
import { AttachmentsStyles } from '../../models/attachments-styles';
import { DownloadRequestConfig } from '@statgpt/download-panel/src/models/download-request';
import { DownloadDatasetAction } from '@statgpt/download-panel/src/types/actions';
import { useDownloadAlertDetails } from './DownloadAlert/useDownloadAlertDetails';

const DOWNLOAD_FILE_INTERVAL_MS = 300;

interface UseAttachmentDownloadFlowParams {
  attachmentsStyles?: AttachmentsStyles;
  downloadDataSet: DownloadDatasetAction;
}

export const useAttachmentDownloadFlow = ({
  attachmentsStyles,
  downloadDataSet,
}: UseAttachmentDownloadFlowParams) => {
  const [isDownloadAlertOpen, setIsDownloadAlertOpen] = useState<boolean>();
  const [isDownloadRunning, setIsDownloadRunning] = useState(false);
  const [downloadAlertDetails, setDownloadAlertDetails] =
    useState<AlertDetails>();
  const activeDownloadAbortControllerRef = useRef<AbortController | null>(null);
  const failedDownloadRequestRef = useRef<DownloadRequestConfig | null>(null);
  const runDownloadRequestRef = useRef<
    ((request: DownloadRequestConfig) => Promise<void>) | null
  >(null);
  const isDownloadRunningRef = useRef(false);
  const isCancellingDownloadRef = useRef(false);

  const showDownloadAlert = useCallback((details: AlertDetails) => {
    setDownloadAlertDetails(details);
    setIsDownloadAlertOpen(true);
  }, []);

  const hideDownloadAlert = useCallback(() => {
    setIsDownloadAlertOpen(false);
  }, []);

  const cancelDownloads = useCallback(() => {
    isCancellingDownloadRef.current = true;
    activeDownloadAbortControllerRef.current?.abort();
    hideDownloadAlert();
  }, [hideDownloadAlert]);

  const retryFailedDownloads = useCallback(() => {
    const failedRequest = failedDownloadRequestRef.current;
    if (!failedRequest || !runDownloadRequestRef.current) {
      return;
    }

    void runDownloadRequestRef.current(failedRequest);
  }, []);

  const isAbortError = useCallback(
    (error: unknown) =>
      error instanceof DOMException
        ? error.name === 'AbortError'
        : error instanceof Error && error.name === 'AbortError',
    [],
  );

  const {
    getStartedAlertDetails,
    getInProgressAlertDetails,
    getSuccessAlertDetails,
    getErrorAlertDetails,
  } = useDownloadAlertDetails({
    attachmentsStyles,
    onCancel: cancelDownloads,
    onRetry: retryFailedDownloads,
  });

  const runDownloadRequest = useCallback(
    async (request: DownloadRequestConfig) => {
      if (isDownloadRunningRef.current) {
        return;
      }

      isDownloadRunningRef.current = true;
      setIsDownloadRunning(true);
      isCancellingDownloadRef.current = false;
      failedDownloadRequestRef.current = null;

      try {
        const failedItems: DownloadRequestConfig['items'] = [];
        const isMultipleDownload = request.items.length > 1;

        if (!isMultipleDownload) {
          showDownloadAlert(getStartedAlertDetails(request));
        }

        for (const [index, item] of request.items.entries()) {
          if (isCancellingDownloadRef.current) {
            return;
          }

          if (isMultipleDownload) {
            showDownloadAlert(
              getInProgressAlertDetails(request, index + 1, index, item.name),
            );
          }

          const controller = new AbortController();
          activeDownloadAbortControllerRef.current = controller;

          try {
            await downloadDataSet(
              item.urn,
              request.dataFormat,
              request.language,
              request.attribute,
              item.filters,
              item.fileName,
              request.isMetadata,
              controller.signal,
            );
          } catch (error) {
            if (isAbortError(error) && isCancellingDownloadRef.current) {
              return;
            }

            failedItems.push(item);
            console.error('Failed to download dataset', error);
          } finally {
            if (activeDownloadAbortControllerRef.current === controller) {
              activeDownloadAbortControllerRef.current = null;
            }
          }

          if (index < request.items.length - 1) {
            await new Promise((resolve) =>
              window.setTimeout(resolve, DOWNLOAD_FILE_INTERVAL_MS),
            );
          }
        }

        if (isCancellingDownloadRef.current) {
          return;
        }

        if (failedItems.length > 0) {
          const failedRequest = { ...request, items: failedItems };
          failedDownloadRequestRef.current = failedRequest;
          showDownloadAlert(getErrorAlertDetails(failedRequest));
          return;
        }

        showDownloadAlert(getSuccessAlertDetails(request));
      } finally {
        activeDownloadAbortControllerRef.current = null;
        isDownloadRunningRef.current = false;
        setIsDownloadRunning(false);
      }
    },
    [
      downloadDataSet,
      getErrorAlertDetails,
      getInProgressAlertDetails,
      getStartedAlertDetails,
      getSuccessAlertDetails,
      isAbortError,
      showDownloadAlert,
    ],
  );

  useEffect(() => {
    runDownloadRequestRef.current = runDownloadRequest;
  }, [runDownloadRequest]);

  useEffect(
    () => () => {
      isCancellingDownloadRef.current = true;
      activeDownloadAbortControllerRef.current?.abort();
    },
    [],
  );

  const startDownload = useCallback(
    (request: DownloadRequestConfig) => {
      if (isDownloadRunningRef.current) {
        return false;
      }

      void runDownloadRequest(request);
      return true;
    },
    [runDownloadRequest],
  );

  return {
    startDownload,
    isDownloadRunning,
    downloadAlertProps: {
      isOpen: isDownloadAlertOpen,
      alertDetails: downloadAlertDetails,
      attachmentsStyles,
      onClose: hideDownloadAlert,
    },
  };
};
