import { ReactNode } from 'react';
import { ChartingIcon } from '@statgpt/conversation-view/src/types/charting-icon';
import { DownloadTitles } from '@statgpt/download-panel/src/models/titles';

export interface AttachmentsStyles {
  showTabIcon?: boolean;
  showChevronIcon?: boolean;
  openAdvancedViewIcon?: ReactNode;
  chartingStyles?: ChartingStyles;
  chartingIcons: Record<ChartingIcon, ReactNode>;
  downloadIcon?: ReactNode;
  downloadChevronIcon?: ReactNode;
  openLinkTitle?: string;
  dataGridTitle?: string;
  downloadTitle?: string;
  closeTitle?: string;
  successDownloadIcon?: ReactNode;
  errorDownloadIcon?: ReactNode;
  datasetIcon?: ReactNode;
  isDownloadDescriptionVisible?: boolean;
  downloadTitles?: DownloadTitles;
}

export interface ChartingStyles {
  colors?: string[];
  ticksColor?: string;
  labelsColor?: string;
}
