import { AttributeIndexValue } from './attribute-index-value';
import { SeriesDeclaration } from '../models/data/dataset';

export type SeriesObservations = Record<string, AttributeIndexValue[]>;

export type Series = Record<string, SeriesDeclaration>;
