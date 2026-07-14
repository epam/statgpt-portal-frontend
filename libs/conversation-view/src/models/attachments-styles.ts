/* eslint-disable @nx/enforce-module-boundaries */
import { ReactNode } from 'react';
import { ChartingIcon } from '../types/charting-icon';
import { DownloadTitles } from '@statgpt/download-panel/src/models/titles';
import { EChartsOption } from 'echarts-for-react/src/types';

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
  chartContentClassName?: string;
  chartAreaClassName?: string;
  chartBodyClassName?: string;
  chartSliderClassName?: string;
  chartSidebarClassName?: string;
}

export interface ChartingStyles {
  colors?: string[];
  ticksColor?: string;
  labelsColor?: string;
  /**
   * Runs last, after any built-in responsive (mobile) adjustments, so it always has final say
   * over the option ECharts renders. Give it a new identity (e.g. via useCallback keyed on a
   * theme value) to make the chart react to a host theme change.
   *
   * On desktop (ctx.isMobile === false), grid.bottom is always re-measured from the actually
   * rendered legend afterwards and will overwrite anything set here — legend row count depends
   * on item count/label length/container width, none of which can be guessed in advance, so it
   * stays library-owned. Use this for colors/fonts/formatting, not spacing. On mobile the legend
   * is forced to a single non-wrapping row, so grid.bottom/legend sizing set here is respected.
   */
  transformOption?: (
    option: EChartsOption,
    ctx: { isMobile: boolean },
  ) => EChartsOption;
}
