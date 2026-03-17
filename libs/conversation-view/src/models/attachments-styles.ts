/* eslint-disable @nx/enforce-module-boundaries */
import { ReactNode } from 'react';
import { ChartingIcon } from '../types/charting-icon';
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
  columnsTitle?: string;
  closeTitle?: string;
  successDownloadIcon?: ReactNode;
  errorDownloadIcon?: ReactNode;
  datasetIcon?: ReactNode;
  isDisplayDatasetIcon?: boolean;
  isDownloadDescriptionVisible?: boolean;
  downloadTitles?: DownloadTitles;
  codeAttachmentContainerClassName?: string;
  copyTitle?: string;
  copiedTitle?: string;
  copyIcon?: ReactNode;
  copiedIcon?: ReactNode;
  copiedTooltip?: string;
}

export interface ChartingStyles {
  colors?: string[];
  ticksColor?: string;
  labelsColor?: string;
}
