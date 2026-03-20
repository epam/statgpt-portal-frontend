interface InputForAskTitles {
  askAnything?: string;
}

interface OnboardingTitles {
  onboardingTitle?: string;
  onboardingFooter?: string;
  onboardingFooterLink?: string;
  skipOnboardingNow?: string;
  refuseOnboarding?: string;
}

interface FooterTitles {
  footerFirstLine?: string;
  footerSecondLine?: string;
}

export interface WelcomeViewTitles
  extends InputForAskTitles,
    OnboardingTitles,
    FooterTitles {
  newChat?: string;
  welcomeTitle?: string;
  close?: string;
}

//TODO: rewright to not extend WelcomeViewTitles
export interface ConversationViewTitles extends WelcomeViewTitles {
  close?: string;
  duplicate?: string;
  chart?: string;
  codeSamples?: string;
  metadata?: string;
  noMetadata?: string;
  settings?: string;
  searchPlaceholder?: string;
  cancel?: string;
  apply?: string;
  explore?: string;
  content?: string;
  advanceViewTitle?: string;
  timeSeries?: string;
  observation?: string;
  dataset?: string;
  agency?: string;
  lastUpdated?: string;
  dataGrid?: string;
  quarterly?: string;
  monthly?: string;
  clearAll?: string;
  clearAllFilters?: string;
  to?: string;
  from?: string;
  all?: string;
  displayOrder?: string;
  hierarchy?: string;
  reset?: string;
  flatList?: string;
  chartNoData?: string;
  chartInfo?: string;
  limits?: string;
  timeseriesLimit?: string;
  limitLinkInfoP1_1?: string;
  limitLinkInfoP1_2?: string;
  limitLinkInfoP1_3?: string;
  limitLinkInfoP2_1?: string;
  limitLinkInfoP2_2?: string;
  limitLinkInfoP2_3?: string;
  limitLinkInfoP2_4?: string;
  limitLinkInfoP2_5?: string;
  limitLinkInfoLink?: string;
  queryUpdatedManually?: string;
  setTo?: string;
  signOut?: string;
  loading?: string;
  dataGridTitle?: string;
  dataGridDescription?: string;
  metadataPerSeriesTitle?: string;
  metadataPerSeriesDescription?: string;
  chartsTitle?: string;
  chartsDescription?: string;
  chartsNavigationTitle?: string;
  chartsNavigationDescription?: string;
  openAdvancedViewTitle?: string;
  openAdvancedViewDescription?: string;
  filtersTitle?: string;
  filtersDescription?: string;
  chartPerSeriesTitle?: string;
  chartPerSeriesDescription?: string;
  metadataPerDatasetTitle?: string;
  metadataPerDatasetDescription?: string;
  exitAdvancedViewTitle?: string;
  exitAdvancedViewDescription?: string;
  countryDimensions?: string;
  indicatorDimensions?: string;
  frequency?: string;
}
