'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import Metadata from '../../AdvancedView/Metadata/Metadata';
import {
  StructuralData,
  getStructureComponentsMap,
} from '@epam/statgpt-sdmx-toolkit';
import {
  getDatasetNameItem,
  getDimensionsFromParams,
  getMetadataDescriptionItems,
  getObsAttributesFromParams,
  getObservationItem,
  getStructureComponentsValues,
  getTimeDimensionItem,
} from '../../../utils/attachments/metadata';
import { MetadataSettings } from '../../../models/metadata';
import { useConversationViewTitles } from '../../../context/ConversationViewTitlesContext';

interface ObservationValueCellRendererParams extends ICellRendererParams {
  dataSetData: StructuralData;
  locale: string;
  metadataSettings?: MetadataSettings;
}

const ObservationValueCellRenderer: FC<ObservationValueCellRendererParams> = (
  params: ObservationValueCellRendererParams,
) => {
  const titles = useConversationViewTitles();
  const [isOpenMetadata, setIsOpenMetadata] = useState<boolean>(false);
  const structureComponentsMap = useMemo(
    () => getStructureComponentsMap(params?.dataSetData),
    [params?.dataSetData],
  );
  const attributes = useMemo(
    () =>
      getStructureComponentsValues(
        getObsAttributesFromParams(params),
        structureComponentsMap,
        params?.locale,
      ),
    [params, structureComponentsMap],
  );
  const metadata = useMemo(
    () => [
      getDatasetNameItem(
        params?.dataSetData?.dataflows?.[0],
        params?.locale,
        titles,
      ),
      ...getStructureComponentsValues(
        getDimensionsFromParams(params, structureComponentsMap),
        structureComponentsMap,
        params?.locale,
      ),
      ...(!params?.metadataSettings?.isMetadataDescription
        ? [
            getTimeDimensionItem(
              params?.dataSetData,
              params?.locale,
              params?.colDef,
            ),
            getObservationItem(
              params?.valueFormatted || params?.value,
              titles,
            ),
          ]
        : []),
      ...attributes,
    ],
    [params, structureComponentsMap, attributes],
  );
  const metadataDescription = useMemo(
    () =>
      getMetadataDescriptionItems(
        params?.dataSetData,
        params?.locale,
        params?.valueFormatted || params?.value,
        titles,
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
      <div className="w-full h-full p-2 text-end relative">
        {params?.valueFormatted || params?.value}
        {attributes?.length > 0 && (
          <div
            className="metadata-indicator"
            title={titles?.metadata || 'View details'}
            onClick={openMetadata}
          ></div>
        )}
      </div>
      {isOpenMetadata && (
        <Metadata
          locale={params?.locale}
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

export default ObservationValueCellRenderer;
