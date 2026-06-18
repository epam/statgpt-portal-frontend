import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { CustomDataGridAttachment } from './CustomGridAttachment';
import { CustomGridAttachment } from '../../../models/attachments';
import { ConversationViewStylesProvider } from '../../../context/ConversationViewStylesContext';
import { OnboardingProvider } from '../../../context/OnboardingContext';

ModuleRegistry.registerModules([AllCommunityModule]);

const withProviders: Decorator = (Story) => (
  <ConversationViewStylesProvider>
    <OnboardingProvider>
      <Story />
    </OnboardingProvider>
  </ConversationViewStylesProvider>
);

const sampleAttachment: CustomGridAttachment = {
  type: 'application/json',
  title: 'GDP by Country',
  grid_data: {
    columns: [
      { field: 'country', headerName: 'Country', flex: 1 },
      { field: 'year', headerName: 'Year', width: 90 },
      { field: 'value', headerName: 'GDP (USD bn)', width: 140 },
      { field: 'growth', headerName: 'Growth %', width: 120 },
    ],
    data: [
      { country: 'Ukraine', year: 2019, value: 153.9, growth: 3.2 },
      { country: 'Ukraine', year: 2020, value: 155.6, growth: 1.1 },
      { country: 'Ukraine', year: 2021, value: 200.1, growth: 3.4 },
      { country: 'Ukraine', year: 2022, value: 160.5, growth: -29.1 },
      { country: 'Poland', year: 2019, value: 596.1, growth: 4.5 },
      { country: 'Poland', year: 2020, value: 596.9, growth: -2.5 },
      { country: 'Poland', year: 2021, value: 679.4, growth: 5.9 },
      { country: 'Poland', year: 2022, value: 688.1, growth: 5.1 },
    ],
  },
};

const manyRowsAttachment: CustomGridAttachment = {
  type: 'application/json',
  title: 'Large Dataset',
  grid_data: {
    columns: [
      { field: 'country', headerName: 'Country', flex: 1 },
      { field: 'year', headerName: 'Year', width: 90 },
      { field: 'value', headerName: 'Value', width: 120 },
    ],
    data: Array.from({ length: 20 }, (_, i) => ({
      country: `Country ${i + 1}`,
      year: 2020 + (i % 4),
      value: Math.round(100 + i * 13.7),
    })),
  },
};

const meta: Meta<typeof CustomDataGridAttachment> = {
  title: 'Conversation View/Grid/CustomGrid',
  component: CustomDataGridAttachment,
  decorators: [withProviders],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CustomDataGridAttachment>;

export const WithData: Story = {
  args: {
    attachment: sampleAttachment,
  },
};

export const Loading: Story = {
  args: {
    attachment: sampleAttachment,
    isDataLoading: true,
  },
};

export const FixedHeight: Story = {
  name: 'Fixed Height (400px cap)',
  args: {
    attachment: manyRowsAttachment,
    fixHeight: true,
  },
};

export const NoHeightCap: Story = {
  name: 'No Height Cap',
  args: {
    attachment: manyRowsAttachment,
    fixHeight: false,
  },
};
