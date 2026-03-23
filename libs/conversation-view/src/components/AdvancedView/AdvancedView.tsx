'use client';

import DataDetails from './DataDetails';
import Header from './Header';
import { Filter, FiltersProps } from '../../models/filters';
import { AttachmentsConfig, AttachmentsProps } from '../../models/attachments';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { MetadataSettings } from '../../models/metadata';
import { FC, useCallback, useMemo, useState } from 'react';
import { AttachmentsActions } from '../../models/actions';
import { FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import { Loader } from '@epam/statgpt-ui-components';
import { useAttachmentsData } from '../../context/AttachmentsData';
import { AdvanceViewStyles } from '../../models/advance-view-styles';
import classNames from 'classnames';
import { ConversationViewTitles } from '../../models/titles';
import { StructureComponentValue } from '../../models/structure-component';
import { LimitMessages } from '@epam/statgpt-ui-components';
import {
  DataConstraints,
  DatasetQueryFilters,
} from '@epam/statgpt-sdmx-toolkit';
import { useAttachmentsDataMultipleQueries } from '../../context/AttachmentsDataMultipleQueries';
import { useCrossDatasetMode } from '../../context/CrossDatasetModeContext';
import { TableSettingsPanel } from './TableSettings/TableSettingsPanel';
import {
  TableSettingsProvider,
  useTableSettingsContext,
} from './TableSettings/TableSettingsContext';

interface Props {
  filtersProps: FiltersProps;
  attachmentsProps: AttachmentsProps;
  shareConversationProps?: ShareConversationProps;
  metadataSettings?: MetadataSettings;
  actions: AttachmentsActions;
  formattingSettings?: FormatNumbersType;
  locale: string;
  titles?: ConversationViewTitles;
  advanceViewStyles?: AdvanceViewStyles;
  getDatasetUpdatedTime?: (
    attributes: StructureComponentValue[],
  ) => string | null;
  limitMessages?: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
}

export const AdvancedView: FC<Props> = ({ attachmentsProps, ...props }) => {
  const currentUrn = useMemo(
    () =>
      attachmentsProps.currentDataQuery?.urn ??
      attachmentsProps.dataQueries?.[0]?.urn ??
      'default',
    [attachmentsProps.currentDataQuery?.urn, attachmentsProps.dataQueries],
  );

  return (
    <TableSettingsProvider currentUrn={currentUrn}>
      <AdvancedViewInternal attachmentsProps={attachmentsProps} {...props} />
    </TableSettingsProvider>
  );
};

const AdvancedViewInternal: FC<Props> = ({
  attachmentsProps,
  actions,
  titles,
  shareConversationProps,
  metadataSettings,
  formattingSettings,
  locale,
  advanceViewStyles,
  attachmentsConfig,
  ...props
}) => {
  const lastMessageAttachments =
    props.filtersProps.conversation?.messages?.at(-1)?.custom_content
      ?.attachments;
  const { isCrossDatasetModeOn } = useCrossDatasetMode();

  const {
    tableSettings: {
      isOpen: isTableSettingsPanelOpened,
      close: closeTableSettingsHandler,
    },
    agGrid: { gridApi, initialColumnsState },
  } = useTableSettingsContext();

  const {
    dimensions,
    structureDimensions,
    structures,
    dataSetAttachments,
    onFiltersChange,
    isLoadingGridData,
    constraints,
  } = useAttachmentsData(
    actions,
    locale,
    attachmentsProps.currentDataQuery,
    formattingSettings,
    attachmentsProps.styles?.chartingStyles,
    metadataSettings,
    titles,
    lastMessageAttachments,
  );
  const {
    dimensionsMap,
    structuresMap,
    structureDimensionsMap,
    constraintsMap,
    crossDatasetGridAttachment,
    isLoadingGridData: isLoadingCrossDsGridData,
  } = useAttachmentsDataMultipleQueries(
    actions,
    locale,
    attachmentsProps.dataQueries,
    attachmentsProps.styles?.chartingStyles,
    formattingSettings,
    metadataSettings,
  );
  const [isFiltering, setIsFiltering] = useState<boolean>();
  const [filters, setFilters] = useState<DatasetQueryFilters>({
    filterKey: null,
    timeFilter: null,
  });

  const isDataLoading = useMemo(
    () => (isCrossDatasetModeOn ? isLoadingCrossDsGridData : isLoadingGridData),
    [isCrossDatasetModeOn, isLoadingCrossDsGridData, isLoadingGridData],
  );

  const handleFiltersChange = useCallback(
    (
      filterParams: DatasetQueryFilters,
      constraints: DataConstraints[],
      modalFilters?: Filter[],
    ) => {
      setFilters(filterParams);
      setIsFiltering(true);
      onFiltersChange(filterParams, constraints, modalFilters);
    },
    [onFiltersChange],
  );

  return (
    <div className="advanced-view flex flex-col flex-1 h-full min-w-0">
      <Header
        titles={titles}
        locale={locale}
        shareConversationProps={shareConversationProps}
        isShowShare={advanceViewStyles?.isShowShare}
      />
      {!attachmentsProps?.datasets?.length ? (
        <Loader />
      ) : (
        <>
          {isLoadingGridData && !isFiltering ? (
            <Loader />
          ) : (
            <>
              <div className="flex flex-1 min-h-0 overflow-auto border-t border-neutrals-500">
                <div
                  className={classNames(
                    'flex-1 min-h-0 overflow-auto',
                    'advanced-view-filters',
                  )}
                >
                  <DataDetails
                    {...props}
                    titles={titles}
                    actions={actions}
                    attachments={
                      isCrossDatasetModeOn
                        ? [crossDatasetGridAttachment]
                        : dataSetAttachments
                    }
                    attachmentsDataQuery={attachmentsProps.currentDataQuery}
                    dataQueries={attachmentsProps?.dataQueries}
                    dimensions={dimensions}
                    attachmentsStyles={attachmentsProps.styles}
                    isDataLoading={isDataLoading}
                    locale={locale}
                    filtersProps={{
                      ...props?.filtersProps,
                      structureDimensions,
                      structures,
                      structureDataMaps: {
                        dimensionsMap,
                        structuresMap,
                        structureDimensionsMap,
                        constraintsMap,
                      },
                      onFiltersChange,
                      initialConstraints: constraints,
                    }}
                    setIsFiltering={setIsFiltering}
                    attachmentsConfig={attachmentsConfig}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
                {isTableSettingsPanelOpened && (
                  <TableSettingsPanel
                    onClose={closeTableSettingsHandler}
                    gridApi={gridApi}
                    initialColumnsState={initialColumnsState}
                    title={attachmentsProps.styles?.columnsTitle}
                    resetTitle={attachmentsProps.styles?.columnsResetTitle}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
