import type { Meta, StoryObj } from '@storybook/react-vite';
import { CloseButton } from './CloseButton';

const meta: Meta<typeof CloseButton> = {
  title: 'UI Components/Buttons/CloseButton',
  component: CloseButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CloseButton>;

export const Default: Story = {};

export const WithTitle: Story = {
  name: 'With Title',
  args: {
    title: 'Close',
  },
};

export const LargeIcon: Story = {
  name: 'Large Icon',
  args: {
    iconWidth: 32,
    iconHeight: 32,
  },
};

export const SmallIcon: Story = {
  name: 'Small Icon',
  args: {
    iconWidth: 12,
    iconHeight: 12,
  },
};

export const WithCustomClass: Story = {
  name: 'With Custom Class',
  args: {
    btnClassNames: 'rounded-full bg-neutrals-300 p-1 hover:bg-neutrals-400',
  },
};
