import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { CustomChartAttachment } from '../CustomChartAttachment';
import { CustomChartAttachmentType } from '../../../../models/attachments';
import { ChartUnit } from '../../../../models/charting';
import { ChartingIcon } from '../../../../types/charting-icon';
import { ConversationViewStylesProvider } from '../../../../context/ConversationViewStylesContext';
import { OnboardingProvider } from '../../../../context/OnboardingContext';

const withProviders: Decorator = (Story) => (
  <ConversationViewStylesProvider>
    <OnboardingProvider>
      <Story />
    </OnboardingProvider>
  </ConversationViewStylesProvider>
);

const years = ['2019', '2020', '2021', '2022', '2023'];

const ukraineUnit: ChartUnit = {
  config: {
    xAxis: { type: 'category', data: years },
    yAxis: { type: 'value', name: 'USD bn' },
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
    yAxis: { type: 'value', name: 'USD bn' },
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
