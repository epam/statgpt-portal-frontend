import type { ECharts, LegendComponentOption } from 'echarts';
import { ChartingPainterBase } from '../../../models/charting';

export function estimateLegendItemWidth(
  chart: ECharts,
  text: string,
  legendOpts: LegendComponentOption,
) {
  const ctx = (chart.getZr()?.painter as unknown as ChartingPainterBase)
    .getRenderedCanvas()
    ?.getContext('2d');

  if (!ctx) return 0;

  const fontSize = legendOpts.textStyle?.fontSize ?? 12;
  const fontFamily = legendOpts.textStyle?.fontFamily ?? 'sans-serif';
  ctx.font = `${fontSize}px ${fontFamily}`;

  const textWidth = ctx.measureText(text).width;
  const iconWidth = legendOpts.itemWidth ?? 25;
  const gap = legendOpts.itemGap ?? 10;

  return textWidth + iconWidth + gap;
}
