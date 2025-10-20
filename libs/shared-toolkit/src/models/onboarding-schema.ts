export interface OnboardingFileSchema {
  isStarted: boolean;
  isSkipped: boolean;
  isFinished: boolean;
  infoElements: {
    dataGrid: boolean;
    metadataPerSeries: boolean;
    charts: boolean;
    chartsNavigation: boolean;
    openAdvancedView: boolean;
    filters: boolean;
    chartPerSeries: boolean;
    metadataPerDataset: boolean;
    exitAdvancedView: boolean;
  };
  lastDisplayedElement: string;
}
