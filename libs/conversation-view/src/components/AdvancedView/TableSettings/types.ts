export type DimensionKeyCustomization = {
  order: string[];
  hidden: Set<string>;
};

export type DimensionCustomizationMap = Map<
  string,
  Map<string, DimensionKeyCustomization>
>;

export enum CrossDatasetGridViewMode {
  Compact = 'compact',
  Extended = 'extended',
}
