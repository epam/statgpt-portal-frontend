import { AttributeIndexValue } from '@statgpt/sdmx-toolkit/src/types/attribute-index-value';
import { SeriesDeclaration } from '@statgpt/sdmx-toolkit/src/models/data/dataset';

export type SeriesObservations = Record<string, AttributeIndexValue[]>;

export type Series = Record<string, SeriesDeclaration>;
