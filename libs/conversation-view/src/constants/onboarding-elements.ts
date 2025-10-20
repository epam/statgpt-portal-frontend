export enum OnboardingElements {
  DATA_GRID = 'dataGrid',
  METADATA_PER_SERIES = 'metadataPerSeries',
  CHARTS = 'charts',
  CHARTS_NAVIGATION = 'chartsNavigation',
  OPEN_ADVANCED_VIEW = 'openAdvancedView',
  FILTERS = 'filters',
  CHART_PER_SERIES = 'chartPerSeries',
  METADATA_PER_DATASET = 'metadataPerDataset',
  EXIT_ADVANCED_VIEW = 'exitAdvancedView',
}

export const OnboardingChartsElements = [
  OnboardingElements.CHARTS,
  OnboardingElements.CHARTS_NAVIGATION,
];

export const OnboardingBasicViewElements = [
  OnboardingElements.DATA_GRID,
  OnboardingElements.METADATA_PER_SERIES,
  ...OnboardingChartsElements,
  OnboardingElements.OPEN_ADVANCED_VIEW,
];

export const OnboardingAdvancedViewElements = [
  OnboardingElements.FILTERS,
  OnboardingElements.CHART_PER_SERIES,
  OnboardingElements.METADATA_PER_DATASET,
  OnboardingElements.EXIT_ADVANCED_VIEW,
];
