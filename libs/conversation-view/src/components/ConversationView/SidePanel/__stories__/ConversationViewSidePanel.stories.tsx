import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { ConversationViewSidePanel } from '../ConversationViewSidePanel';
import { SidePanelCustomizationProvider } from '../SidePanelCustomizationContext';

const withFixedHeight: Decorator = (Story) => (
  <div style={{ height: 500, display: 'flex' }}>
    <Story />
  </div>
);

const meta: Meta<typeof ConversationViewSidePanel> = {
  title: 'Conversation View/SidePanel/ConversationViewSidePanel',
  component: ConversationViewSidePanel,
  decorators: [withFixedHeight],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConversationViewSidePanel>;

export const Default: Story = {
  args: {
    title: 'Dataset Details',
    onClose: () => {},
    children: <p className="px-5">Panel content goes here.</p>,
  },
};

export const WithHeaderExtension: Story = {
  name: 'With Header Extension',
  args: {
    title: 'Dataset Details',
    onClose: () => {},
    headerExtension: (
      <button type="button" className="text-primary">
        Expand
      </button>
    ),
    children: <p className="px-5">Panel content goes here.</p>,
  },
};

function CollapseCloseControl({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="rounded bg-neutrals-300 px-2 py-1 text-neutrals-1000"
    >
      Collapse
    </button>
  );
}

export const CustomCloseControl: Story = {
  name: 'Custom Close Control',
  render: (args) => (
    <SidePanelCustomizationProvider
      value={{ closeControl: CollapseCloseControl }}
    >
      <ConversationViewSidePanel {...args} />
    </SidePanelCustomizationProvider>
  ),
  args: {
    title: 'Dataset Details',
    onClose: () => {},
    children: <p className="px-5">Panel content goes here.</p>,
  },
};

export const FullWidth: Story = {
  name: 'Full Width (mobile override)',
  render: (args) => (
    <SidePanelCustomizationProvider
      value={{ classes: { panel: 'w-full border-l-0' } }}
    >
      <ConversationViewSidePanel {...args} />
    </SidePanelCustomizationProvider>
  ),
  args: {
    title: 'Dataset Details',
    onClose: () => {},
    children: <p className="px-5">Panel content goes here.</p>,
  },
};
