import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { CustomChartAttachment } from '../CustomChartAttachment';
import { CustomChartAttachmentType } from '../../../../models/attachments';
import { ChartUnit } from '../../../../models/charting';
import { ChartingIcon } from '../../../../types/charting-icon';
import { ConversationViewStylesProvider } from '../../../../context/ConversationViewStylesContext';
import { OnboardingProvider } from '../../../../context/OnboardingContext';
import { EChartsOption } from 'echarts-for-react/src/types';

const withProviders: Decorator = (Story) => (
  <ConversationViewStylesProvider>
    <OnboardingProvider>
      <Story />
    </OnboardingProvider>
  </ConversationViewStylesProvider>
);

const DARK_SCHEME_STYLE: CSSProperties = {
  background: '#1B1B1D',
  color: '#F5F5F5',
  padding: 16,
  ['--neutrals-1000' as string]: '#F5F5F5',
  ['--neutrals-900' as string]: '#E0E0E2',
  ['--neutrals-800' as string]: '#B8B8BB',
  ['--neutrals-700' as string]: '#9C9C9F',
};

const withDarkColorScheme: Decorator = (Story) => (
  <div style={DARK_SCHEME_STYLE}>
    <Story />
  </div>
);

const LEGEND_BAND_HEIGHT = 20;
const LEGEND_GAP_ABOVE = 12;
const GRID_TOP = 12;

function compactChartLayout(
  option: EChartsOption,
  ctx: { isMobile: boolean },
): EChartsOption {
  if (!ctx.isMobile) {
    return { ...option, grid: { ...option.grid, top: GRID_TOP } };
  }
  const legend = Array.isArray(option.legend)
    ? option.legend[0]
    : option.legend;
  return {
    ...option,
    grid: {
      ...option.grid,
      top: GRID_TOP,
      bottom: LEGEND_BAND_HEIGHT + LEGEND_GAP_ABOVE,
    },
    legend: { ...legend, height: LEGEND_BAND_HEIGHT },
  };
}

function darkenChartOption(
  option: EChartsOption,
  ctx: { isMobile: boolean },
): EChartsOption {
  const compacted = compactChartLayout(option, ctx);
  const legend = Array.isArray(compacted.legend)
    ? compacted.legend[0]
    : compacted.legend;
  const xAxis = Array.isArray(compacted.xAxis)
    ? compacted.xAxis[0]
    : compacted.xAxis;
  const yAxis = Array.isArray(compacted.yAxis)
    ? compacted.yAxis[0]
    : compacted.yAxis;
  return {
    ...compacted,
    legend: {
      ...legend,
      textStyle: { ...legend?.textStyle, color: '#F5F5F5' },
    },
    xAxis: {
      ...xAxis,
      axisLabel: { color: '#C7C7C9' },
      axisLine: { lineStyle: { color: '#4A4A4D' } },
      nameTextStyle: { color: '#C7C7C9' },
    },
    yAxis: {
      ...yAxis,
      axisLabel: { color: '#C7C7C9' },
      splitLine: { lineStyle: { color: '#333336' } },
      nameTextStyle: { color: '#C7C7C9' },
    },
  };
}

const years = ['2019', '2020', '2021', '2022', '2023'];

const ukraineUnit: ChartUnit = {
  config: {
    xAxis: { type: 'category', data: years },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'line',
        name: 'Ukraine',
        data: [153.9, 155.6, 200.1, 160.5, 173.4],
      },
    ],
    tooltip: { trigger: 'axis' },
  },
  dimensions: [
    { id: 'REF_AREA', title: 'Country', value: 'Ukraine' },
    { id: 'INDICATOR', title: 'Indicator', value: 'GDP at current prices' },
  ],
  rows: years.map((y, i) => ({
    year: y,
    value: [153.9, 155.6, 200.1, 160.5, 173.4][i],
  })),
  limitedByRowsAmountTo: undefined,
  isPlottable: true,
};

const polandUnit: ChartUnit = {
  config: {
    xAxis: { type: 'category', data: years },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'line',
        name: 'Poland',
        data: [596.1, 596.9, 679.4, 688.1, 749.0],
      },
    ],
    tooltip: { trigger: 'axis' },
  },
  dimensions: [
    { id: 'REF_AREA', title: 'Country', value: 'Poland' },
    { id: 'INDICATOR', title: 'Indicator', value: 'GDP at current prices' },
  ],
  rows: years.map((y, i) => ({
    year: y,
    value: [596.1, 596.9, 679.4, 688.1, 749.0][i],
  })),
  limitedByRowsAmountTo: undefined,
  isPlottable: true,
};

function buildMultiCountryUnit(
  countrySeries: { name: string; data: number[] }[],
): ChartUnit {
  return {
    config: {
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value' },
      series: countrySeries.map((series) => ({
        type: 'line',
        name: series.name,
        data: series.data,
      })),
      tooltip: { trigger: 'axis' },
    },
    dimensions: [
      {
        id: 'REF_AREA',
        title: 'Countries',
        value: countrySeries.map((series) => series.name).join(', '),
      },
      { id: 'INDICATOR', title: 'Indicator', value: 'GDP at current prices' },
    ],
    rows: years.map((y, i) => ({
      year: y,
      ...Object.fromEntries(
        countrySeries.map((series) => [series.name, series.data[i]]),
      ),
    })),
    limitedByRowsAmountTo: undefined,
    isPlottable: true,
  };
}

const westernEuropeUnit = buildMultiCountryUnit([
  { name: 'Ukraine', data: [153.9, 155.6, 200.1, 160.5, 173.4] },
  { name: 'Poland', data: [596.1, 596.9, 679.4, 688.1, 749.0] },
  { name: 'Germany', data: [3888.2, 3846.4, 4260.3, 4082.5, 4456.1] },
  { name: 'France', data: [2716.3, 2647.9, 2957.9, 2796.3, 3030.9] },
  { name: 'Italy', data: [2011.3, 1900.5, 2119.6, 2074.1, 2255.5] },
]);

const easternEuropeUnit = buildMultiCountryUnit([
  { name: 'Czechia', data: [251.7, 245.3, 281.8, 296.0, 344.8] },
  { name: 'Slovakia', data: [105.9, 105.7, 116.4, 126.0, 141.6] },
  { name: 'Hungary', data: [163.5, 157.5, 182.2, 178.8, 213.5] },
  { name: 'Romania', data: [250.1, 248.7, 284.1, 301.6, 349.9] },
  { name: 'Bulgaria', data: [69.9, 68.6, 84.1, 92.2, 107.6] },
]);

const multiCountryMultiUnitAttachment: CustomChartAttachmentType = {
  type: 'application/json',
  title: 'GDP by Country',
  charting_data: { units: [westernEuropeUnit, easternEuropeUnit] },
};

const singleUnitAttachment: CustomChartAttachmentType = {
  type: 'application/json',
  title: 'GDP by Country',
  charting_data: { units: [ukraineUnit] },
};

const multiUnitAttachment: CustomChartAttachmentType = {
  type: 'application/json',
  title: 'GDP by Country',
  charting_data: { units: [ukraineUnit, polandUnit] },
};

const chartingIcons = {
  [ChartingIcon.PREVIOUS]: <IconChevronLeft width={20} height={20} />,
  [ChartingIcon.NEXT]: <IconChevronRight width={20} height={20} />,
};

const meta: Meta<typeof CustomChartAttachment> = {
  title: 'Conversation View/Chart/CustomChart',
  component: CustomChartAttachment,
  decorators: [withProviders],
  tags: ['autodocs'],
  args: {
    icons: chartingIcons,
  },
};

export default meta;
type Story = StoryObj<typeof CustomChartAttachment>;

export const WithData: Story = {
  args: {
    attachment: singleUnitAttachment,
  },
};

export const MultipleCharts: Story = {
  name: 'Multiple Charts (slider)',
  args: {
    attachment: multiUnitAttachment,
  },
};

export const Loading: Story = {
  args: {
    attachment: singleUnitAttachment,
    isDataLoading: true,
  },
};

export const FillHeight: Story = {
  name: 'Fill Height',
  render: (args) => (
    <div style={{ height: 300, maxWidth: 640 }}>
      <CustomChartAttachment {...args} />
    </div>
  ),
  args: {
    attachment: singleUnitAttachment,
    fillHeight: true,
  },
};

export const FixedHeight: Story = {
  name: 'Fixed Height (400px cap)',
  args: {
    attachment: singleUnitAttachment,
    fixHeight: true,
  },
};

export const NarrowCard: Story = {
  name: 'Narrow Card (mobile, fixHeight)',
  args: {
    attachment: multiUnitAttachment,
    fixHeight: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile2' },
  },
};

export const CustomStylesDark: Story = {
  name: 'Custom Styles / Dark',
  decorators: [withDarkColorScheme],
  render: (args) => (
    <div style={{ height: 480 }}>
      <CustomChartAttachment {...args} />
    </div>
  ),
  args: {
    attachment: multiCountryMultiUnitAttachment,
    transformOption: darkenChartOption,
    fillHeight: true,
    contentClassName: 'gap-2',
    chartBodyClassName: 'gap-1',
    chartAreaClassName: 'gap-2',
    sliderClassName: 'w-fit self-center',
  },
};
