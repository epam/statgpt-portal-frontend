import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconBuildingBank } from '@tabler/icons-react';
import DatasetInfoDetails from '../DatasetInfoDetails';
import { DatasetInfoDetailsProvider } from '../DatasetInfoDetailsContext';
import { StructureComponentValue } from '../../../../../models/structure-component';

const formatValue = (value: StructureComponentValue['value']) =>
  String(value ?? '');

const dataset: StructureComponentValue = {
  title: 'Dataset',
  value: 'GDP at current prices',
};
const agency: StructureComponentValue = { title: 'Agency', value: 'IMF' };
const lastUpdated: StructureComponentValue = {
  title: 'Last updated',
  value: '2026-06-01',
};

const meta: Meta<typeof DatasetInfoDetails> = {
  title: 'Conversation View/SidePanel/DatasetInfoDetails',
  component: DatasetInfoDetails,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DatasetInfoDetails>;

export const Default: Story = {
  args: {
    dataset,
    agency,
    lastUpdated,
    externalLink: 'https://example.com/dataset',
    formatValue,
  },
};

export const WithoutExternalLink: Story = {
  name: 'Without External Link',
  args: {
    dataset,
    agency,
    lastUpdated,
    formatValue,
  },
};

export const CustomDatasetIcon: Story = {
  name: 'Custom Dataset Icon',
  render: (args) => (
    <DatasetInfoDetailsProvider
      value={{ icon: <IconBuildingBank className="size-4 text-primary" /> }}
    >
      <DatasetInfoDetails {...args} />
    </DatasetInfoDetailsProvider>
  ),
  args: {
    dataset,
    agency,
    lastUpdated,
    externalLink: 'https://example.com/dataset',
    formatValue,
  },
};

function ButtonExternalLink({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={() => alert(`Custom navigation handler called with: ${url}`)}
      className="rounded bg-neutrals-300 px-2 py-0.5 text-neutrals-1000"
    >
      View source
    </button>
  );
}

export const CustomExternalLink: Story = {
  name: 'Custom External Link (no new tab)',
  render: (args) => (
    <DatasetInfoDetailsProvider value={{ externalLink: ButtonExternalLink }}>
      <DatasetInfoDetails {...args} />
    </DatasetInfoDetailsProvider>
  ),
  args: {
    dataset,
    agency,
    lastUpdated,
    externalLink: 'https://example.com/dataset',
    formatValue,
  },
};
