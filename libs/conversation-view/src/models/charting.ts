import { ImagePatternObject } from 'echarts';
import { GridData } from '../types/data-grid/grid-data';
import { EChartsOption } from 'echarts-for-react';

export interface ChartUnitRows {
  rows: GridData[];
}

export interface ChartUnit extends ChartUnitRows {
  config: EChartsOption;
  dimensions: DimensionInfo[];
  limitedByRowsAmountTo: number | undefined;
  isPlottable: boolean;
}

export type ChartUnitValue = ChartUnit | (() => ChartUnit);

export interface ChartUnitGroup {
  title?: string;
  units: ChartUnit[];
}

export interface DimensionInfo {
  id: string;
  title: string;
  value: string;
}

export interface ChartingData {
  units: ChartUnit[];
  groups?: ChartUnitGroup[];
}

export interface ChartingTooltipFormatterParams {
  axisValueLabel?: string;
  marker?: string;
  seriesName?: string;
  value: string | number | Date | null | undefined;
}

export interface ChartingPainterBase {
  getRenderedCanvas(opts?: {
    backgroundColor?: string | ImagePatternObject;
    pixelRatio?: number;
  }): HTMLCanvasElement;
}
