import { ChartingStyles } from '@statgpt/conversation-view/src/models/attachments-styles';
import { EChartsOption } from 'echarts-for-react/src/types';
import {
  DEFAULT_LABEL_COLOR,
  DEFAULT_TICK_COLOR,
} from '@statgpt/conversation-view/src/constants/charting-default-colors';

export function buildChartConfig(
  timePeriods: string[],
  series: Record<string, string | unknown>[],
  styles?: ChartingStyles,
): EChartsOption {
  const config: EChartsOption = {
    animation: false,
    tooltip: {
      trigger: 'axis',
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
