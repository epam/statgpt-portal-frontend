import { GridData } from '../types/data-grid/grid-data';
import { EChartsOption } from 'echarts-for-react';

export interface ChartUnitRows {
  rows: GridData[];
}

export interface ChartUnit extends ChartUnitRows {
  config: EChartsOption;
  dimensions: DimensionInfo[];
  limitedByRowsAmountTo: number | undefined;
}

export interface DimensionInfo {
  id: string;
  title: string;
  value: string;
}

export interface ChartingData {
  units: ChartUnit[];
}
