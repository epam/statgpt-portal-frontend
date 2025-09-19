'use client';

import { useCallback, useMemo, useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import MetadataIcon from '../../../assets/icons/metadata.svg';
import { IconButton } from '@statgpt/ui-components/src/components/IconButton/IconButton';
import Metadata from '../../AdvancedView/Metadata/Metadata';
import { StructuralData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { Data } from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { getStructureComponentsMap } from '@statgpt/sdmx-toolkit/src/utils/get-structure-components';
import {
  getAttributesFromParams,
  getDatasetNameItem,
  getDimensionsFromParams,
  getMetadataDescriptionItems,
  getStructureComponentsValues,
} from '../../../utils/attachments/metadata';
import { MetadataSettings } from '../../../models/metadata';
import { Locale } from '@statgpt/shared-toolkit/src/types/locale';
import { TimeSeries } from '@statgpt/sdmx-toolkit/src/models/data/time-series';
import { getDimensionGroupAttributes } from '../../../utils/attachments/group-attributes';
import { ConversationViewTitles } from '../../../models/titles';

interface MetadataCellRendererParams extends ICellRendererParams {
  attributesData: Data;
  dataSetData: StructuralData;
  locale: Locale;
  metadataSettings?: MetadataSettings;
  titles: ConversationViewTitles;
}

const MetadataCellRenderer = (params: MetadataCellRendererParams) => {
  const [isOpenMetadata, setIsOpenMetadata] = useState<boolean>(false);
  const structureComponentsMap = useMemo(
    () => getStructureComponentsMap(params?.dataSetData),
    [params?.dataSetData],
  );
  const metadata = useMemo(
    () => [
      getDatasetNameItem(
        params?.dataSetData?.dataflows?.[0],
        params?.locale,
        params.titles,
      ),
      ...getStructureComponentsValues(
        getDimensionsFromParams(params, structureComponentsMap),
        structureComponentsMap,
        params?.locale,
      ),
      ...getStructureComponentsValues(
        getAttributesFromParams(params),
        structureComponentsMap,
        params?.locale,
      ),
      ...getDimensionGroupAttributes(
        params?.attributesData,
        params?.dataSetData?.dataStructures?.[0],
        structureComponentsMap,
        (params?.data?.originalData as TimeSeries)?.parsedTimeSeriesValue,
        params?.locale,
      ),
    ],
    [params, structureComponentsMap],
  );
  const metadataDescription = useMemo(
    () =>
      getMetadataDescriptionItems(
        params?.dataSetData,
        params?.locale,
        params?.valueFormatted || params?.value,
        params.titles,
        params?.colDef,
        params?.data,
      ),
    [params],
  );

  const openMetadata = useCallback(() => {
    setIsOpenMetadata(true);
  }, []);

  const closeMetadata = useCallback(() => {
    setIsOpenMetadata(false);
  }, []);

  return (
    <>
      <IconButton
        title={params.titles?.metadata || 'View details'}
        buttonClassName="text-neutrals-1000 border-none p-1"
        icon={<MetadataIcon className="w-5 h-5" />}
        onClick={openMetadata}
      />
      {isOpenMetadata && (
        <Metadata
          titles={params.titles}
          metadata={metadata}
          metadataDescription={
            params?.metadataSettings?.isMetadataDescription
              ? metadataDescription
              : []
          }
          isOpenMetadata={isOpenMetadata}
          onCloseMetadata={closeMetadata}
        />
      )}
    </>
  );
};

export default MetadataCellRenderer;
