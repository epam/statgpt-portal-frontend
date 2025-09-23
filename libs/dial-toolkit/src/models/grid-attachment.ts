export interface GridAttachmentContent {
  data: {
    schema: Schema;
    data: RowData[];
  };
  metadata: Metadata;
  layout: Layout;
}

export interface Schema {
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: string;
}

export interface RowData {
  index: number;
  value: number;
  [key: string]: unknown;
}

export interface Metadata {
  time_column: string;
  pinned_columns?: string[];
}

export interface Layout {
  height: number;
  width: number;
}
