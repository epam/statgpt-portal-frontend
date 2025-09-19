import { DataMessage } from '../../models/data/data-message';
import {
  TimeSeries,
  TimeSeriesObservation,
  TimeSeriesValue,
} from '../../models/data/time-series';
import { SeriesDeclaration } from '../../models/data/dataset';
import { AttributeIndexValue } from '../../types/attribute-index-value';
import { getAttachedDimensionsSeriesByTsId } from '../../utils/get-attached-dimensions-series';
import { DimensionGroupAttribute } from '../../models/dimension-group';
import { getAttributeValueFromDataQueryResponse } from '../../utils/get-attributes-value';
import {
  DimensionValue,
  Structure,
  StructureAttribute,
  StructureContent,
  StructureItemBase,
} from '../../models/data/structure';

export const OBSERVATION_KEY = 'Observation';

export const getParsedResponse = (data: DataMessage): TimeSeries[] => {
  const dataSets = data?.data?.dataSets;
  const structure = data?.data?.structures?.[0];

  if (!dataSets || !structure) {
    return [];
  }

  const attributes = structure.attributes;
  const dimensions = structure.dimensions;
  const dimensionGroup = attributes?.dimensionGroup || [];

  const series = dataSets[0].series || dataSets[0].observations;
  const currentDimension = !dimensions.series?.length
    ? dimensions.observation
    : dimensions.series;
  const result = [] as TimeSeries[];

  for (const key in series) {
    const values: TimeSeriesValue[] = [];
    const { name, parsedTimeSeriesValue } = getSeriesName(
      key,
      currentDimension,
    );
    const ser = (
      series as Record<string, SeriesDeclaration | AttributeIndexValue[]>
    )[key];
    const seriesAttributes = (ser as SeriesDeclaration).attributes || [];

    if (Object.keys(ser).length === 0) {
      result.push({
        name,
        parsedTimeSeriesValue,
        values,
        attributes: [],
        dataSetAttrs: [],
      });
      continue;
    }

    values.push(
      ...getTimeSeriesValues(ser as AttributeIndexValue[], structure),
    );

    const seriesAttrs = getSeriesAttributes(
      attributes?.series || [],
      (i) => seriesAttributes[i] as string | number,
    );

    const dataSetAttrs = getDataSetAttributes(
      structure.attributes?.dataSet || [],
      dataSets[0].attributes?.filter((val) => val != null) || [],
    );

    const dimensionGroupKey = getAttachedDimensionsSeriesByTsId(
      data,
      parsedTimeSeriesValue,
    );

    const dimensionGroupAttributes = dimensionGroup.map((attribute, index) => {
      const dimensionGroupData = dimensionGroupKey[attribute.id];
      const dimensionGroupValue = getAttributeValueFromDataQueryResponse(
        attribute,
        dimensionGroupData.values[index],
      );

      return {
        attribute,
        dimensionGroupValue,
        dimensionGroupData,
      } as DimensionGroupAttribute;
    });

    result.push({
      name,
      parsedTimeSeriesValue,
      values,
      attributes: seriesAttrs,
      dataSetAttrs: dataSetAttrs,
      dimensionGroupAttributes,
    });
  }

  return result;
};

export const getSeriesName = (
  key: string,
  dimensions?: StructureItemBase[],
): { name: string; parsedTimeSeriesValue: string[] } => {
  const separatedKey = key.split(/(?<!\|):(?!\||$)/);

  const parsedTimeSeriesValue: string[] = [];
  for (let i = 0; i < separatedKey.length; i++) {
    const dimension = dimensions?.[i];
    const num = Number(separatedKey[i]);
    if (num < 0 || dimension == null) {
      continue;
    }

    const value = dimension.values[num];
    if (value == null) {
      parsedTimeSeriesValue.push(separatedKey[i].replace('|:', ':'));
      continue;
    }
    parsedTimeSeriesValue.push(value?.id || value?.value || '');
  }
  return {
    name: getTimeSeriesId(parsedTimeSeriesValue),
    parsedTimeSeriesValue,
  };
};

export const getSeriesAttributes = (
  declarations: StructureItemBase[],
  getPositions: (i: number) => number | string,
): TimeSeriesObservation[] => {
  const attrs = [] as TimeSeriesObservation[];
  for (let i = 0; i < declarations.length; i++) {
    const declaration = declarations[i];
    const position = getPositions(i);
    const value =
      position != null && declaration.values != null
        ? getAttributeValue(position, declaration)
        : void 0;
    attrs.push({
      name: declaration.id,
      value: value as string,
    });
  }
  return attrs;
};

const getAttributeValue = (
  position: number | string,
  declaration: StructureItemBase,
) => {
  const value: DimensionValue = declaration.values[position as number];
  if (value == null) {
    return typeof position === 'object' ? position : position.toString();
  }
  return value?.id || value?.value || value?.ids || value?.values;
};

export const getTimeSeriesId = (parsedTimeSeriesValue: string[]): string => {
  return parsedTimeSeriesValue
    .map((id) => (id ? decodeDimensionId(id) : ''))
    .join('.');
};

export const decodeDimensionId = (dimensionId: string): string => {
  return dimensionId.replace(/\./g, '|.').replace(/:/g, '|:');
};

const getTimeSeriesValues = (
  ser: SeriesDeclaration | AttributeIndexValue[],
  structure: Structure,
): TimeSeriesValue[] => {
  const observationLength = structure.measures?.observation?.length as number;
  if ((ser as SeriesDeclaration).observations == null) {
    // non timeseries
    return [
      {
        values: getMeasuresValues(ser as number[], structure.measures),
        obsAttributes: getSeriesAttributes(
          structure.attributes?.observation || [],
          (i) =>
            (ser as AttributeIndexValue[])[i + observationLength] as
              | string
              | number,
        ),
        dimensionAtObservation: OBSERVATION_KEY,
      },
    ];
  }

  const seriesObservations = (ser as SeriesDeclaration).observations;
  const timeDimension = structure.dimensions.observation?.[0];
  const values: TimeSeriesValue[] = [];
  for (const obsKey in seriesObservations) {
    const time = timeDimension?.values[obsKey as unknown as number];

    values.push({
      dimensionAtObservation: (time?.value || time?.id) as string,
      values: getMeasuresValues(
        seriesObservations[obsKey] as number[],
        structure.measures,
      ),
      obsAttributes: getSeriesAttributes(
        structure.attributes?.observation || [],
        (i) =>
          seriesObservations[obsKey][i + observationLength] as string | number,
      ),
    });
  }

  return values;
};

const getMeasuresValues = (
  values: AttributeIndexValue[],
  measures: StructureContent<StructureItemBase>,
): TimeSeriesObservation[] => {
  return (
    measures?.observation?.map((obs, index) => {
      return { name: obs.id, value: values[index] } as TimeSeriesObservation;
    }) || []
  );
};

const getDataSetAttributes = (
  declarations: StructureAttribute[],
  attributesDataSets: number[],
): TimeSeriesObservation[] =>
  declarations.reduce(
    (
      attributes: TimeSeriesObservation[],
      declaration: StructureAttribute,
      index: number,
    ) => {
      const position: number = attributesDataSets[index];
      addItemToAttributes(attributes, declaration, position, '');

      return attributes;
    },
    [],
  );

const addItemToAttributes = (
  attributes: TimeSeriesObservation[],
  declaration: StructureAttribute,
  key: number,
  emptyValue: '' | null,
) => {
  const value =
    key != null
      ? declaration?.values?.length > 0
        ? declaration.values[key]?.id || declaration.values[key]?.value
        : String(key)
      : emptyValue;

  attributes.push({
    name: declaration.id,
    value: value || '',
  });
};
