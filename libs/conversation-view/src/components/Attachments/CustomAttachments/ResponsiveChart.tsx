import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type {
  ECharts,
  EChartsOption,
  LegendComponentOption,
  Model,
} from 'echarts';
import type ReactEChartsRef from 'echarts-for-react';
import { estimateLegendItemWidth } from '../../../utils/attachments/charting/chart-legend-width';

interface Props {
  option: EChartsOption;
  style?: React.CSSProperties;
}

const ResponsiveEChart: FC<Props> = ({ option, style }) => {
  const chartRef = useRef<ReactEChartsRef>(null);
  const [adjustedOption, setAdjustedOption] = useState<EChartsOption>(option);

  const adjustGrid = useCallback(() => {
    const chart = chartRef.current?.getEchartsInstance?.() as
      | ECharts
      | undefined;
    if (!chart) return;

    const chartEl = chart.getDom();
    const chartWidth = chartEl.clientWidth;

    const legendOpts = (option.legend as LegendComponentOption) || {};
    const itemHeight = legendOpts.itemHeight ?? 14;
    const fontSize = legendOpts.textStyle?.fontSize ?? 12;
    const legendData =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chart as any).getModel().getComponent('legend').getData() || [];

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
  }, [option.legend]);

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

  return <ReactECharts ref={chartRef} option={adjustedOption} style={style} />;
};

export default ResponsiveEChart;
