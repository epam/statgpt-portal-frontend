import { ChartingStyles } from '../../../models/attachments-styles';
import { EChartsOption } from 'echarts-for-react/src/types';
import {
  DEFAULT_LABEL_COLOR,
  DEFAULT_TICK_COLOR,
} from '../../../constants/charting-default-colors';
import { ChartingTooltipFormatterParams } from '../../../models/charting';

export function buildChartConfig(
  timePeriods: string[],
  series: Record<string, string | unknown>[],
  styles?: ChartingStyles,
): EChartsOption {
  const config: EChartsOption = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      formatter: (params: ChartingTooltipFormatterParams[]) => {
        let result = params[0].axisValueLabel + '<br/>';

        params.forEach((item: ChartingTooltipFormatterParams) => {
          if (item.value !== null && item.value !== undefined) {
            result +=
              item.marker + ' ' + item.seriesName + ': ' + item.value + '<br/>';
          }
        });
        return result;
      },
    },
    legend: {
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '40px',
      containLabel: true,
    },
    xAxis: {
      ...getBaseAxis(styles?.ticksColor, styles?.labelsColor),
      type: 'category',
      boundaryGap: false,
      data: timePeriods,
    },
    yAxis: {
      ...getBaseAxis(styles?.ticksColor, styles?.labelsColor),
      type: 'value',
    },
    series: series,
  };

  if (styles?.colors != null) {
    config.color = styles.colors;
  }

  return config;
}

function getBaseAxis(
  ticksColor = DEFAULT_TICK_COLOR,
  labelColor = DEFAULT_LABEL_COLOR,
): Record<string, unknown> {
  return {
    splitLine: {
      show: true,
      showMaxLine: false,
      lineStyle: {
        color: [ticksColor],
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: labelColor,
    },
    axisLine: {
      lineStyle: {
        color: ticksColor,
      },
    },
  };
}
