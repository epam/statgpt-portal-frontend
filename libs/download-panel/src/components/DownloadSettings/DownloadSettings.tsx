import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import {
  DatasetQueryFilters,
  Dimension,
  DownloadType,
  FileColumnsAttribute,
  SdmxDataFormat,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery, Locale } from '@epam/statgpt-shared-toolkit';
import {
  AlertDetails,
  Button,
  CollapsibleBlock,
  InlineAlert,
  InlineAlertType,
  Popup,
  PopUpSize,
  LimitMessages,
  RequestLimitMessage,
  DownloadFormatMessage,
} from '@epam/statgpt-ui-components';
import ToggleActiveIcon from '../../assets/icons/toggle-active.svg';
import ToggleInactiveIcon from '../../assets/icons/toggle-inactive.svg';
import { DownloadActions } from '../../models/actions';
import { DownloadSettingItem } from '../../models/download-settings-item';
import {
  DOWNLOAD_ATTRIBUTES,
  DOWNLOAD_DATA_FORMATS,
} from '../../constants/download-options';
import DownloadOptionBlock from '../DownloadOptionBlock/DownloadOptionBlock';
import DownloadDatasetsBlock from '../DownloadDatasetsBlock/DownloadDatasetsBlock';
import { getDownloadFilters } from '../../utils/get-filter';
import { DownloadTitles } from '../../models/titles';
import { DownloadDatasetItem } from '../../models/download-dataset-item';

// Browsers block simultaneous download triggers as popups.
const DOWNLOAD_FILE_INTERVAL_MS = 300;

interface Props {
  actions: DownloadActions;
  datasetIcon: ReactNode;
  isDisplayDatasetIcon?: boolean;
  datasetName: string;
  type: DownloadType | null;
  dataQuery?: DataQuery;
  locale?: string;
  dimensions?: Dimension[];
  filters?: DatasetQueryFilters;
  urn?: string;
  titles?: DownloadTitles;
  collapsible?: boolean;
  downloadDatasets?: DownloadDatasetItem[];
  onCloseModal: () => void;
  setIsShowDownloadAlert?: (isShowDownloadAlert?: boolean) => void;
  setDownloadAlertDetails?: (downloadAlertDetails?: AlertDetails) => void;
  limitMessages?: LimitMessages;
  showLimitMessage?: boolean;
  externalLink?: string;
}

const DownloadSettings: FC<Props> = ({
  actions,
  dataQuery,
  datasetIcon,
  isDisplayDatasetIcon = true,
  datasetName,
  onCloseModal,
  type = DownloadType.FULL_DATASET,
  locale = Locale.EN,
  dimensions,
  filters,
  urn,
  titles,
  collapsible = true,
  downloadDatasets,
  limitMessages,
  showLimitMessage,
  externalLink,
}) => {
  const downloadAttributes = DOWNLOAD_ATTRIBUTES(titles);

  const [selectedDataFormat, setSelectedDataFormat] =
    useState<DownloadSettingItem>(DOWNLOAD_DATA_FORMATS[0]);

  const [selectedAttribute, setSelectedAttribute] =
    useState<DownloadSettingItem>(downloadAttributes[0]);

  const [isMetadata, setIsMetadata] = useState<boolean>(true);

  const [selectedDatasetUrns, setSelectedDatasetUrns] = useState<Set<string>>(
    () => new Set(downloadDatasets?.map((d) => d.urn) ?? []),
  );

  useEffect(() => {
    setSelectedDatasetUrns(new Set(downloadDatasets?.map((d) => d.urn) ?? []));
  }, [downloadDatasets]);

  const onToggleDataset = useCallback((urn: string) => {
    setSelectedDatasetUrns((prev) => {
      const next = new Set(prev);
      if (next.has(urn)) {
        next.delete(urn);
      } else {
        next.add(urn);
      }
      return next;
    });
  }, []);

  const downloadDataset = useCallback(
    (dq: DataQuery | undefined, urnParam: string, filename: string) => {
      const downloadFilters = getDownloadFilters(type, dq, dimensions, filters);
      actions.downloadDataSet(
        urnParam,
        selectedDataFormat.value as SdmxDataFormat,
        locale,
        selectedAttribute.value as FileColumnsAttribute,
        downloadFilters,
        filename,
        isMetadata,
      );
    },
    [
      type,
      dimensions,
      filters,
      actions,
      locale,
      isMetadata,
      selectedDataFormat.value,
      selectedAttribute.value,
    ],
  );

  const onDownloadClick = useCallback(() => {
    const dataFormat = selectedDataFormat.value as SdmxDataFormat;

    if (downloadDatasets && downloadDatasets.length > 0) {
      const selected = downloadDatasets.filter((d) =>
        selectedDatasetUrns.has(d.urn),
      );
      selected.forEach((dataset, i) => {
        setTimeout(() => {
          downloadDataset(
            dataset.dataQuery,
            dataset.urn,
            `${dataset.name}.${dataFormat}`,
          );
        }, i * DOWNLOAD_FILE_INTERVAL_MS);
      });
    } else {
      downloadDataset(
        dataQuery,
        dataQuery?.urn || urn || '',
        `${datasetName}.${dataFormat}`,
      );
    }

    onCloseModal();
  }, [
    downloadDatasets,
    selectedDatasetUrns,
    selectedDataFormat.value,
    dataQuery,
    urn,
    datasetName,
    downloadDataset,
    onCloseModal,
  ]);

  const metadataContent = (
    <div
      className={classNames('download-metadata flex cursor-pointer gap-4', {
        'download-metadata-active': isMetadata,
      })}
    >
      {isMetadata ? (
        <ToggleActiveIcon
          width={44}
          height={24}
          className="text-primary"
          onClick={() => setIsMetadata(!isMetadata)}
        />
      ) : (
        <ToggleInactiveIcon
          width={44}
          height={24}
          className="text-neutrals-500"
          onClick={() => setIsMetadata(!isMetadata)}
        />
      )}
      <div>{titles?.includeMetadata || 'Include Metadata'}</div>
    </div>
  );

  return (
    <Popup
      heading={
        <p className="download-heading h2">{titles?.download || 'Download'}</p>
      }
      portalId="filters"
      size={PopUpSize.LG}
      containerClassName="download-popup h-[80%]"
      dividers={false}
      onClose={onCloseModal}
      closeButtonTitle={titles?.close || 'Close'}
    >
      {!downloadDatasets && (
        <div className="download-info flex flex-col gap-1 px-6">
          <div className="download-info-text flex gap-1">
            <p className="body-3 text-neutrals-800">
              {titles?.dataset || 'Dataset'}:
            </p>
            <span className="h4 flex min-w-0 flex-1 flex-row gap-x-1">
              {isDisplayDatasetIcon && datasetIcon}
              <p className="min-w-0 flex-1 truncate">{datasetName}</p>
            </span>
          </div>
          {showLimitMessage && (
            <RequestLimitMessage
              limitMessages={limitMessages}
              isDownload
              query={externalLink}
            />
          )}
        </div>
      )}
      <div className="download-settings flex flex-col overflow-auto p-6">
        <DownloadOptionBlock
          title={titles?.dataFormat || 'Data Format'}
          selectedValue={selectedDataFormat}
          setSelectedValue={setSelectedDataFormat}
          items={DOWNLOAD_DATA_FORMATS}
          collapsible={collapsible}
          infoMessage={
            <DownloadFormatMessage
              limitMessages={limitMessages}
              query={externalLink}
            />
          }
        />

        {selectedDataFormat.value === SdmxDataFormat.CSV && (
          <DownloadOptionBlock
            title={titles?.attributes || 'Attributes'}
            selectedValue={selectedAttribute}
            setSelectedValue={setSelectedAttribute}
            items={downloadAttributes}
            collapsible={collapsible}
          />
        )}

        {downloadDatasets && (
          <>
            <DownloadDatasetsBlock
              title={titles?.datasetsToDownload || 'Datasets to download'}
              items={downloadDatasets}
              selectedUrns={selectedDatasetUrns}
              onToggle={onToggleDataset}
              collapsible={collapsible}
              rowsLabel={titles?.rows || 'rows'}
            />
            <InlineAlert type={InlineAlertType.Note}>
              <span className="font-bold">
                {titles?.filesWillBeDownloaded?.(selectedDatasetUrns.size) ??
                  `${selectedDatasetUrns.size} files will be downloaded`}
              </span>{' '}
              {titles?.oneFilePerDataset ?? '- one file per selected dataset.'}
            </InlineAlert>
          </>
        )}

        {collapsible ? (
          <CollapsibleBlock
            title={titles?.metadata || 'Metadata'}
            value={
              isMetadata
                ? titles?.all || 'Included'
                : titles?.none || 'Not included'
            }
          >
            {metadataContent}
          </CollapsibleBlock>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center py-4">
              <span>{titles?.metadata || 'Metadata'}</span>
            </div>
            <div className="pb-4">{metadataContent}</div>
          </div>
        )}
      </div>
      <div className="download-button mt-auto flex items-center gap-x-3 p-6">
        {titles?.cancel && (
          <Button
            buttonClassName="text-button-tertiary"
            title={titles.cancel}
            onClick={onCloseModal}
          />
        )}
        <Button
          buttonClassName="text-button-primary"
          title={titles?.download || 'Download'}
          onClick={onDownloadClick}
        />
      </div>
    </Popup>
  );
};

export default DownloadSettings;
