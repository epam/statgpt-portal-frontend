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
import { useIsMobile } from '@epam/statgpt-ui-components';

interface Props {
  option: EChartsOption;
  style?: CSSProperties;
}

const MOBILE_LEGEND_HEIGHT = 44;
const MOBILE_GRID_BOTTOM = 56;
const MOBILE_CHART_HEIGHT = 280;
const MOBILE_AXIS_LABEL_WIDTH = 52;

const ResponsiveEChart: FC<Props> = ({ option, style }) => {
  const chartRef = useRef<ReactEChartsRef>(null);
  const isMobileChart = useIsMobile(768);
  const [adjustedOption, setAdjustedOption] = useState<EChartsOption>(option);

  useEffect(() => {
    setAdjustedOption(getBaseOption(option, isMobileChart));
  }, [option, isMobileChart]);

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
      style={getChartStyle(style, isMobileChart)}
    />
  );
};

function getChartStyle(
  style: CSSProperties | undefined,
  isMobileChart: boolean,
): CSSProperties | undefined {
  if (!isMobileChart) {
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
): EChartsOption {
  const nextOption = cloneDeep(option);
  return isMobileChart ? applyMobileChartOption(nextOption) : nextOption;
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
