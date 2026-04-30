import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DataConstraints,
  DatasetDimensionsScheme,
  DatasetQueryFilters,
  getLocalizedName,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery, FormatNumbersType } from '@epam/statgpt-shared-toolkit';
import { Filter } from '../models/filters';
import { buildQueryFiltersForPythonAttachment } from '../utils/query-filters';
import {
  getConstraints,
  GetDatasetData,
  GetDatasetDetails,
  GetPythonAttachment,
} from '../types/actions';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import {
  getDataConstraintsMap,
  getDataSetData,
  getStructureDataMaps,
} from '../utils/attachments/attachments-data';
import {
  CustomCodeAttachment,
  CustomGridAttachment,
} from '../models/attachments';
import {
  createInitialChartAttachment,
  createInitialCrossDatasetGridAttachment,
} from '../constants/attachments';
import { buildMarkdownAttachments } from '../utils/attachments/markdown-attachments';
import { Attachment } from '@epam/ai-dial-shared';
import { useConversationViewTitles } from './ConversationViewTitlesContext';
import {
  ChartingStyles,
  useDatasetDimensionsMetadataMap,
} from '@epam/statgpt-conversation-view';
import { buildCrossDatasetGridAttachment } from '../utils/attachments/cross-dataset-grid/build-cross-dataset-grid-attachment';
import { MetadataSettings } from '../models/metadata';
import { StructureDataMaps } from '../models/structure-data';
import { buildChartData } from '../utils/attachments/charting/chart-data';

export function useAttachmentsDataMultipleQueries(
  actions: {
    getDataSet: GetDatasetDetails;
    getDataSetData: GetDatasetData;
    getConstraints: getConstraints;
    getPythonAttachment?: GetPythonAttachment;
  },
  locale: string,
  dataQueries?: DataQuery[],
  chartStyles?: ChartingStyles,
  formattingSettings?: FormatNumbersType,
  metadataSettings?: MetadataSettings,
  rawAttachments?: Attachment[],
  onCodeAttachmentUpdated?: (attachment: Attachment) => void,
) {
  const [structureDataMaps, setStructureDataMaps] =
    useState<StructureDataMaps>();
  const titles = useConversationViewTitles();
  const [datasetDimensionsSchemesMap, setDatasetDimensionsSchemesMap] =
    useState<Map<string, DatasetDimensionsScheme | undefined>>();
  const [isLoadingGridData, setIsLoadingGridData] = useState(false);

  const [crossDatasetGridAttachment, setCrossDatasetGridAttachment] =
    useState<CustomGridAttachment>(
      createInitialCrossDatasetGridAttachment(titles?.dataGrid),
    );
  const [crossDatasetChartAttachment, setCrossDatasetChartAttachment] =
    useState(createInitialChartAttachment(titles?.chart));
  const [codeAttachments, setCodeAttachments] = useState<
    CustomCodeAttachment[]
  >([]);

  const {
    getConstraints,
    getDataSet,
    getDataSetData: getDataSetDataAction,
    getPythonAttachment,
  } = actions;

  const loadConstraintsMap = useCallback(
    async (dataQueries: DataQuery[]) => {
      try {
        const constraintsMap = await getDataConstraintsMap(
          dataQueries,
          getConstraints,
        );
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap,
        }));
      } catch {
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap: new Map<string, DataConstraints[]>(),
        }));
      }
    },
    [getConstraints],
  );

  const loadStructureData = useCallback(
    async (dataQueries: DataQuery[]) => {
      const structureDataMaps = await getStructureDataMaps(
        dataQueries,
        getDataSet,
        getDataSetDataAction,
        setIsLoadingGridData,
      );
      setStructureDataMaps((prevStructureDataMaps) => ({
        ...prevStructureDataMaps,
        ...structureDataMaps,
      }));
    },
    [getDataSet, getDataSetDataAction],
  );

  const { getDimensionsScheme } = useDatasetDimensionsMetadataMap();

  const loadDimensionsSchemes = useCallback(
    (dataQueries: DataQuery[]) => {
      const dimensionSchemesMap = new Map<
        string,
        DatasetDimensionsScheme | undefined
      >();
      for (const dataQuery of dataQueries) {
        dimensionSchemesMap.set(
          dataQuery.urn,
          getDimensionsScheme(dataQuery.urn),
        );
      }
      setDatasetDimensionsSchemesMap(dimensionSchemesMap);
    },
    [getDimensionsScheme],
  );

  useEffect(() => {
    async function loadDataSets(dataQueries: DataQuery[]) {
      setIsLoadingGridData(true);

      try {
        loadDimensionsSchemes(dataQueries);
        await Promise.all([
          loadConstraintsMap(dataQueries),
          loadStructureData(dataQueries),
        ]);
      } catch (err) {
        console.error('Error loading dataset details', err as object);
      } finally {
        setIsLoadingGridData(false);
      }
    }

    if (dataQueries?.length) {
      loadDataSets(dataQueries);
    }
  }, [
    dataQueries,
    loadConstraintsMap,
    loadDimensionsSchemes,
    loadStructureData,
  ]);

  useEffect(() => {
    if (rawAttachments?.length) {
      setCodeAttachments(
        buildMarkdownAttachments(
          rawAttachments,
          undefined,
          titles?.codeSamples,
        ),
      );
    }
  }, [rawAttachments, titles]);

  useEffect(() => {
    const { structuresMap, dataMessagesMap, constraintsMap } =
      structureDataMaps ?? {};
    if (
      structuresMap != null &&
      structuresMap.size > 0 &&
      dataMessagesMap != null &&
      constraintsMap != null &&
      datasetDimensionsSchemesMap != null &&
      !isLoadingGridData
    ) {
      setCrossDatasetGridAttachment((prev) => ({
        ...prev,
        ...buildCrossDatasetGridAttachment(
          structuresMap,
          dataMessagesMap,
          datasetDimensionsSchemesMap,
          dataQueries || [],
          locale,
          formattingSettings,
          metadataSettings,
          chartStyles,
          titles,
          constraintsMap,
          {
            startPeriod: null,
            endPeriod: null,
          },
        ),
      }));
    }
  }, [
    structureDataMaps,
    dataQueries,
    locale,
    formattingSettings,
    metadataSettings,
    chartStyles,
    titles,
    datasetDimensionsSchemesMap,
    isLoadingGridData,
  ]);

  useEffect(() => {
    const { structuresMap, dataMessagesMap } = structureDataMaps ?? {};

    if (
      structuresMap != null &&
      structuresMap.size > 0 &&
      dataMessagesMap != null &&
      !isLoadingGridData
    ) {
      const chartGroups = (dataQueries || []).flatMap((dataQuery) => {
        const structures = structuresMap.get(dataQuery.urn);
        const dataMessage = dataMessagesMap.get(dataQuery.urn);

        if (!structures || !dataMessage) {
          return [];
        }

        const datasetName = getLocalizedName(structures.dataflows?.[0], locale);

        return [
          {
            title: datasetName,
            units: buildChartData(
              structures,
              dataMessage,
              dataQuery,
              locale,
              chartStyles,
            ).units,
          },
        ];
      });

      setCrossDatasetChartAttachment((prev) => ({
        ...prev,
        charting_data: {
          units: chartGroups.flatMap((group) => group.units),
          groups: chartGroups,
        },
      }));
    }
  }, [structureDataMaps, dataQueries, locale, chartStyles, isLoadingGridData]);

  const crossDatasetAttachments = useMemo(
    () => [
      crossDatasetGridAttachment,
      crossDatasetChartAttachment,
      ...codeAttachments,
    ],
    [crossDatasetGridAttachment, crossDatasetChartAttachment, codeAttachments],
  );

  const onMultipleDataFiltersChange = useCallback(
    (
      filterParamsMap: Map<string, DatasetQueryFilters>,
      constraintsMap?: Map<string, DataConstraints[] | undefined>,
      dataQueries?: DataQuery[],
      filtersMap?: Map<string, Filter[]>,
    ): void => {
      try {
        setIsLoadingGridData(true);
        setStructureDataMaps((prevStructureDataMaps) => ({
          ...prevStructureDataMaps,
          constraintsMap,
        }));
        dataQueries?.forEach((dataQuery) => {
          getDataSetData(
            dataQuery,
            filterParamsMap?.get(dataQuery?.urn) as DatasetQueryFilters,
            getDataSetDataAction,
          )
            .then(({ dataMessage, structureDimensions }) => {
              setStructureDataMaps((prevStructureDataMaps) => {
                const dataMessagesMap = new Map(
                  prevStructureDataMaps?.dataMessagesMap,
                );
                const structureDimensionsMap = new Map(
                  prevStructureDataMaps?.structureDimensionsMap,
                );

                dataMessagesMap.set(dataQuery.urn, dataMessage);
                structureDimensionsMap.set(
                  dataQuery.urn,
                  structureDimensions || [],
                );

                return {
                  ...prevStructureDataMaps,
                  dataMessagesMap,
                  structureDimensionsMap,
                };
              });
            })
            .finally(() => setIsLoadingGridData(false));
        });

        if (getPythonAttachment && dataQueries?.length) {
          const updatedDataQueries = dataQueries.map((dq) => {
            const uiFilters = filtersMap?.get(dq.urn) ?? [];
            const updatedFiltersFromUI =
              buildQueryFiltersForPythonAttachment(uiFilters);
            const uiFilterCodes = new Set(
              updatedFiltersFromUI.map((f) => f.componentCode),
            );
            const hiddenFilters = (dq.filters ?? []).filter(
              (f) => !uiFilterCodes.has(f.componentCode),
            );
            return {
              ...dq,
              filters: [...hiddenFilters, ...updatedFiltersFromUI],
            };
          });
          getPythonAttachment(updatedDataQueries)
            .then((result) => {
              if (!result?.python_code) return;
              const newCodeAttachment: CustomCodeAttachment = {
                type: AttachmentType.CUSTOM_CODE_SAMPLE,
                data: result.python_code,
                language: 'python',
                title: titles?.codeSamples || 'Python Code',
              };
              setCodeAttachments([newCodeAttachment]);
              onCodeAttachmentUpdated?.({
                type: AttachmentType.MARKDOWN,
                title: 'Python Code',
                data: `\`\`\`python\n${result.python_code}\n\`\`\``,
              });
            })
            .catch((err) =>
              console.error('Error refreshing python attachment:', err),
            );
        }
      } catch (err) {
        console.error('Error loading dataset data', err as object);
      }
    },
    [
      getDataSetDataAction,
      getPythonAttachment,
      titles,
      onCodeAttachmentUpdated,
    ],
  );

  return {
    structureDataMaps,
    datasetDimensionsSchemesMap,
    isLoadingGridData,
    crossDatasetAttachments,
    onMultipleDataFiltersChange,
  };
}
