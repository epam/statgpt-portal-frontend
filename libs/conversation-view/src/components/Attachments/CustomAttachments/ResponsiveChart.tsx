import {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactECharts from 'echarts-for-react';
import type {
  ECharts,
  EChartsOption,
  LegendComponentOption,
  Model,
} from 'echarts';
import type ReactEChartsRef from 'echarts-for-react';
import { estimateLegendItemWidth } from '../../../utils/attachments/charting/chart-legend-width';
import { cloneDeep } from 'lodash';
import { MOBILE_BREAKPOINT, useIsMobile } from '@epam/statgpt-ui-components';

interface Props {
  option: EChartsOption;
  style?: CSSProperties;
  fillHeight?: boolean;
  transformOption?: (
    option: EChartsOption,
    ctx: { isMobile: boolean },
  ) => EChartsOption;
}

const MOBILE_LEGEND_HEIGHT = 44;
const MOBILE_GRID_BOTTOM = 56;
const MOBILE_CHART_HEIGHT = 280;
const MOBILE_AXIS_LABEL_WIDTH = 52;

const ResponsiveEChart: FC<Props> = ({
  option,
  style,
  fillHeight,
  transformOption,
}) => {
  const chartRef = useRef<ReactEChartsRef>(null);
  const isMobileChart = useIsMobile(MOBILE_BREAKPOINT);
  const [adjustedOption, setAdjustedOption] = useState<EChartsOption>(option);

  useEffect(() => {
    setAdjustedOption(getBaseOption(option, isMobileChart, transformOption));
  }, [option, isMobileChart, transformOption]);

  /**
   * Measures the actually rendered legend and sets grid.bottom to fit it, on
   * desktop, regardless of transformOption — legend row count depends on
   * item count/label length/container width, none of which a consumer can
   * know in advance, so this stays library-owned rather than guessable.
   * transformOption still applies afterwards on top of this: it can style
   * the legend/axis (colors, fonts) but not override this measurement.
   */
  const adjustGrid = useCallback(() => {
    const chart = chartRef.current?.getEchartsInstance?.() as
      | ECharts
      | undefined;
    if (!chart || isMobileChart) return;

    const chartEl = chart.getDom();
    const chartWidth = chartEl.clientWidth;
    if (chartWidth <= 0) return;

    const legendOpts = (option.legend as LegendComponentOption) || {};
    const itemHeight = legendOpts.itemHeight ?? 14;
    const fontSize = legendOpts.textStyle?.fontSize ?? 12;
    const legendData =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chart as any).getModel()?.getComponent('legend')?.getData() || [];

    let legendTotalWidth = 0;
    legendData.forEach((item: Model) => {
      const text = item.option.name || '';
      legendTotalWidth += estimateLegendItemWidth(chart, text, legendOpts);
    });

    const rowCount = Math.max(1, Math.ceil(legendTotalWidth / chartWidth));
    const legendHeight = rowCount * (+itemHeight + +fontSize + 6);
    const margin = 20;

    setAdjustedOption((prev) => ({
      ...prev,
      grid: {
        ...(prev.grid || {}),
        bottom: legendHeight + margin,
      },
    }));
  }, [isMobileChart, option.legend]);

  useEffect(() => {
    adjustGrid();

    const handleResize = () => {
      adjustGrid();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [option, adjustGrid]);

  return (
    <ReactECharts
      notMerge={true}
      lazyUpdate={false}
      ref={chartRef}
      option={adjustedOption}
      style={getChartStyle(style, isMobileChart, fillHeight)}
    />
  );
};

/**
 * fillHeight already means "trust the parent's own height" on the
 * surrounding CustomChartAttachment layout (it skips that component's fixed
 * mobile min-heights) — the fixed mobile pixel height here would otherwise
 * silently override that intent and leave dead space in a taller parent.
 */
function getChartStyle(
  style: CSSProperties | undefined,
  isMobileChart: boolean,
  fillHeight?: boolean,
): CSSProperties | undefined {
  if (!isMobileChart || fillHeight) {
    return style;
  }

  return {
    ...style,
    height: MOBILE_CHART_HEIGHT,
    minHeight: MOBILE_CHART_HEIGHT,
  };
}

function getBaseOption(
  option: EChartsOption,
  isMobileChart: boolean,
  transformOption?: (
    option: EChartsOption,
    ctx: { isMobile: boolean },
  ) => EChartsOption,
): EChartsOption {
  const nextOption = cloneDeep(option);
  const baseOption = isMobileChart
    ? applyMobileChartOption(nextOption)
    : nextOption;
  return transformOption
    ? transformOption(baseOption, { isMobile: isMobileChart })
    : baseOption;
}

function applyMobileChartOption(option: EChartsOption): EChartsOption {
  return {
    ...option,
    legend: getMobileLegend(option.legend),
    grid: {
      ...getObjectOption(option.grid),
      left: 8,
      right: 8,
      bottom: MOBILE_GRID_BOTTOM,
      containLabel: true,
    },
    xAxis: mapAxisOption(option.xAxis, (axis) => ({
      ...axis,
      axisLabel: {
        ...getObjectOption(axis.axisLabel),
        hideOverlap: true,
      },
    })),
    yAxis: mapAxisOption(option.yAxis, (axis) => ({
      ...axis,
      axisLabel: {
        ...getObjectOption(axis.axisLabel),
        width: MOBILE_AXIS_LABEL_WIDTH,
        overflow: 'truncate',
        formatter: formatCompactAxisLabel,
      },
    })),
  };
}

function getMobileLegend(
  legend: EChartsOption['legend'],
): EChartsOption['legend'] {
  const enhanceLegend = (legendOption: unknown): LegendComponentOption => {
    const baseLegend = getObjectOption(legendOption);
    return {
      ...baseLegend,
      type: 'scroll',
      orient: 'horizontal',
      left: 0,
      right: 0,
      bottom: 0,
      height: MOBILE_LEGEND_HEIGHT,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: {
        ...getObjectOption(baseLegend.textStyle),
        width: 120,
        overflow: 'truncate',
      },
    };
  };

  return Array.isArray(legend)
    ? legend.map(enhanceLegend)
    : enhanceLegend(legend);
}

function mapAxisOption(
  axisOption: EChartsOption['xAxis'] | EChartsOption['yAxis'],
  mapOption: (axis: Record<string, unknown>) => Record<string, unknown>,
) {
  const mapAxis = (axis: unknown) => mapOption(getObjectOption(axis));

  return Array.isArray(axisOption)
    ? axisOption.map(mapAxis)
    : mapAxis(axisOption);
}

function getObjectOption(option: unknown): Record<string, unknown> {
  return option != null && typeof option === 'object' && !Array.isArray(option)
    ? (option as Record<string, unknown>)
    : {};
}

const compactAxisFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumSignificantDigits: 3,
});

function formatCompactAxisLabel(value: string | number): string {
  const numericValue =
    typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));

  return Number.isFinite(numericValue)
    ? compactAxisFormatter.format(numericValue)
    : String(value);
}

export default ResponsiveEChart;
