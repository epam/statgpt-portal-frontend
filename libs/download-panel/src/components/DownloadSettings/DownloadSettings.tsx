import { FC, ReactNode, useCallback, useState } from 'react';
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
import { getDownloadFilters } from '../../utils/get-filter';
import { DownloadTitles } from '../../models/titles';

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

  const onDownloadClick = useCallback(() => {
    const downloadFilters = getDownloadFilters(
      type,
      dataQuery,
      dimensions,
      filters,
    );
    const urnValue = dataQuery?.urn || urn || '';
    const attribute = selectedAttribute.value as FileColumnsAttribute;
    const dataFormat = selectedDataFormat.value as SdmxDataFormat;
    const fileName = `${datasetName}.${dataFormat}`;

    actions.downloadDataSet(
      urnValue,
      dataFormat,
      locale,
      attribute,
      downloadFilters,
      fileName,
      isMetadata,
    );

    onCloseModal();
  }, [
    type,
    dataQuery,
    dimensions,
    filters,
    urn,
    selectedAttribute.value,
    selectedDataFormat.value,
    actions,
    locale,
    isMetadata,
    onCloseModal,
    datasetName,
  ]);

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
      <div className="download-info flex flex-col gap-1 px-6">
        <div className="download-info-text flex gap-1">
          <p className="text-neutrals-800 body-3">
            {titles?.dataset || 'Dataset'}:
          </p>
          <span className="h4 flex flex-row gap-x-1 flex-1 min-w-0">
            {isDisplayDatasetIcon && datasetIcon}
            <p className="flex-1 min-w-0 truncate">{datasetName}</p>
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
      <div className="download-settings flex flex-col overflow-auto p-6">
        <DownloadOptionBlock
          title={titles?.dataFormat || 'Data Format'}
          selectedValue={selectedDataFormat}
          setSelectedValue={setSelectedDataFormat}
          items={DOWNLOAD_DATA_FORMATS}
          infoMessage={
            <DownloadFormatMessage
              limitMessages={limitMessages}
              query={externalLink}
            />
          }
        />

        <DownloadOptionBlock
          title={titles?.attributes || 'Attributes'}
          selectedValue={selectedAttribute}
          setSelectedValue={setSelectedAttribute}
          items={downloadAttributes}
        />

        <CollapsibleBlock
          title={titles?.metadata || 'Metadata'}
          value={
            isMetadata
              ? titles?.all || 'Included'
              : titles?.none || 'Not included'
          }
        >
          <div
            className={`flex gap-4 cursor-pointer download-metadata ${isMetadata ? 'download-metadata-active' : ''}`}
          >
            {isMetadata ? (
              <ToggleActiveIcon
                width={44}
                height={24}
                className="text-primary"
                onClick={() => {
                  setIsMetadata(!isMetadata);
                }}
              />
            ) : (
              <ToggleInactiveIcon
                width={44}
                height={24}
                className="text-neutrals-500"
                onClick={() => {
                  setIsMetadata(!isMetadata);
                }}
              />
            )}
            <div>{titles?.includeMetadata || 'Include Metadata'}</div>
          </div>
        </CollapsibleBlock>
      </div>
      <div className="download-button flex p-6 mt-auto">
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
