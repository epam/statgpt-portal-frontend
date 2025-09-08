import { FC, ReactNode, useCallback, useState } from 'react';
import { DataQuery } from '@statgpt/shared-toolkit/src/models/data-query';
import { PopUpSize } from '@statgpt/ui-components/src/types/pop-up';
import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { Popup } from '@statgpt/ui-components/src/components/Popup/Popup';
import { generateDownloadedFile } from '@statgpt/download-panel/src/utils/generate-downloaded-document';
import ToggleActiveIcon from '@statgpt/download-panel/src/assets/icons/toggle-active.svg';
import ToggleInactiveIcon from '@statgpt/download-panel/src/assets/icons/toggle-inactive.svg';
import { CollapsibleBlock } from '@statgpt/ui-components/src/components/CollapsibleBlock/CollapsibleBlock';
import {
  FileColumnsAttribute,
  SdmxDataFormat,
} from '@statgpt/sdmx-toolkit/src/types/files';
import { DownloadActions } from '@statgpt/download-panel/src/models/actions';
import { DownloadSettingItem } from '@statgpt/download-panel/src/models/download-settings-item';
import {
  DOWNLOAD_ATTRIBUTES,
  DOWNLOAD_DATA_FORMATS,
} from '@statgpt/download-panel/src/constants/download-options';
import { DownloadType } from '@statgpt/sdmx-toolkit/src/types/files';
import { DownloadData } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { Locale } from '@statgpt/shared-toolkit/src/types/locale';
import DownloadOptionBlock from '@statgpt/download-panel/src/components/DownloadOptionBlock/DownloadOptionBlock';
import { Dimension } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/data-structure';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';
import { getDownloadFilters } from '@statgpt/download-panel/src/utils/get-filter';
import { AlertDetails } from '@statgpt/ui-components/src/models/alert';
import { AlertType } from '@statgpt/ui-components/src/constants/alert';
import { DownloadTitles } from '@statgpt/download-panel/src/models/titles';

interface Props {
  actions: DownloadActions;
  datasetIcon: ReactNode;
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
}

const DownloadSettings: FC<Props> = ({
  actions,
  dataQuery,
  datasetIcon,
  datasetName,
  onCloseModal,
  type = DownloadType.FULL_DATASET,
  locale = Locale.EN,
  dimensions,
  filters,
  urn,
  titles,
  setIsShowDownloadAlert,
  setDownloadAlertDetails,
}) => {
  const downloadAttributes = DOWNLOAD_ATTRIBUTES(titles);

  const [selectedDataFormat, setSelectedDataFormat] =
    useState<DownloadSettingItem>(DOWNLOAD_DATA_FORMATS[0]);

  const [selectedAttribute, setSelectedAttribute] =
    useState<DownloadSettingItem>(downloadAttributes[0]);

  const [isMetadata, setIsMetadata] = useState<boolean>(false);

  const onDownloadClick = useCallback(() => {
    setIsShowDownloadAlert?.(true);
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

    setDownloadAlertDetails?.({
      type: AlertType.IN_PROGRESS,
      title: titles?.downloadPrepare || 'Preparing file for download...',
      text: fileName,
    });

    actions
      .downloadDataSet(
        urnValue,
        dataFormat,
        locale,
        attribute,
        downloadFilters,
        isMetadata,
      )
      .then(({ data }: DownloadData) => {
        generateDownloadedFile(data, datasetName, dataFormat);
        setDownloadAlertDetails?.({
          type: AlertType.SUCCESS,
          title: titles?.downloadSuccess || 'File downloaded',
          text: fileName,
        });
      })
      .catch(() => {
        setDownloadAlertDetails?.({
          type: AlertType.ERROR,
          title: titles?.downloadError || 'File download error',
          text: fileName,
        });
      });
    onCloseModal();
  }, [
    setIsShowDownloadAlert,
    type,
    dataQuery,
    dimensions,
    filters,
    urn,
    selectedAttribute.value,
    selectedDataFormat.value,
    setDownloadAlertDetails,
    titles,
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
            {titles?.downloadType || 'Download type'}:
          </p>
          <span className="h4">
            {type === DownloadType.DATA_IN_TABLE
              ? titles?.partialDataset || 'Data in table'
              : titles?.fullDataset || 'Full Dataset'}
          </span>
        </div>
        <div className="download-info-text flex gap-1">
          <p className="text-neutrals-800 body-3">
            {titles?.dataset || 'Dataset'}:
          </p>
          <span className="h4 flex flex-row gap-x-1 flex-1 min-w-0">
            {datasetIcon}
            <p className="flex-1 min-w-0 truncate">{datasetName}</p>
          </span>
        </div>
      </div>
      <div className="download-settings flex flex-col overflow-auto p-6">
        <DownloadOptionBlock
          title={titles?.dataFormat || 'Data Format'}
          selectedValue={selectedDataFormat}
          setSelectedValue={setSelectedDataFormat}
          items={DOWNLOAD_DATA_FORMATS}
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
                className="text-primary"
                onClick={() => {
                  setIsMetadata(!isMetadata);
                }}
              />
            ) : (
              <ToggleInactiveIcon
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
