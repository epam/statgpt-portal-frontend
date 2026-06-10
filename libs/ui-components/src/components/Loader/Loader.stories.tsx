import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loader } from './Loader';

const meta: Meta<typeof Loader> = {
  title: 'UI Components/Display/Loader',
  component: Loader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Default: Story = {};
