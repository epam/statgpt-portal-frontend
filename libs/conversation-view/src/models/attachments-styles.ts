/* eslint-disable @nx/enforce-module-boundaries */
import { ReactNode } from 'react';
import { ChartingIcon } from '../types/charting-icon';
import { DownloadTitles } from '@statgpt/download-panel/src/models/titles';

export interface AttachmentsStyles {
  showTabIcon?: boolean;
  showChevronIcon?: boolean;
  openAdvancedViewIcon?: ReactNode;
  advancedViewTitle?: string;
  chartingStyles?: ChartingStyles;
  chartingIcons?: Record<ChartingIcon, ReactNode>;
  downloadIcon?: ReactNode;
  downloadChevronIcon?: ReactNode;
  openLinkTitle?: string;
  dataGridTitle?: string;
  downloadTitle?: string;
  downloadButtonTextClassName?: string;
  hideDownloadTextInConversationView?: boolean;
  hideDownloadIconInAdvancedView?: boolean;
  tableSettings?: string;
  tableSettingsIcon?: ReactNode;
  tableSettingsResetIcon?: ReactNode;
  columnsDisplayTitle?: string;
  columnsSearchPlaceholder?: string;
  compactViewTitle?: string;
  compactViewDescription?: ReactNode;
  extendedViewTitle?: string;
  extendedViewDescription?: ReactNode;
  closeTitle?: string;
  infoDownloadIcon?: ReactNode;
  successDownloadIcon?: ReactNode;
  errorDownloadIcon?: ReactNode;
  downloadInProgressActionIcon?: ReactNode;
  downloadErrorActionIcon?: ReactNode;
  datasetIcon?: ReactNode;
  isDownloadDescriptionVisible?: boolean;
  downloadTitles?: DownloadTitles;
  downloadCollapsible?: boolean;
  codeAttachmentContainerClassName?: string;
  copyTitle?: string;
  copiedTitle?: string;
  copyIcon?: ReactNode;
  copiedIcon?: ReactNode;
  copiedTooltip?: string;
  copyHoverTooltip?: string;
  limitationInfoIcon?: ReactNode;
  limitationInfoContentClassName?: string;
}

export interface ChartingStyles {
  colors?: string[];
  ticksColor?: string;
  labelsColor?: string;
}
