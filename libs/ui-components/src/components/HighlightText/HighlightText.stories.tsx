import type { Meta, StoryObj } from '@storybook/react-vite';
import { HighlightText } from './HighlightText';

const meta: Meta<typeof HighlightText> = {
  title: 'UI Components/Display/HighlightText',
  component: HighlightText,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HighlightText>;

export const Default: Story = {
  args: {
    text: 'Gross domestic product',
    highlightText: 'domestic',
  },
};

export const MultipleMatches: Story = {
  name: 'Multiple Matches',
  args: {
    text: 'Annual annual growth rate',
    highlightText: 'annual',
  },
};

export const CaseInsensitive: Story = {
  name: 'Case Insensitive',
  args: {
    text: 'Consumer Price Index',
    highlightText: 'PRICE',
  },
};

export const NoMatch: Story = {
  name: 'No Match',
  args: {
    text: 'Unemployment rate',
    highlightText: 'inflation',
  },
};

export const NoHighlightText: Story = {
  name: 'No Highlight Text',
  args: {
    text: 'Population growth',
  },
};

export const EmptyText: Story = {
  name: 'Empty Text',
  args: {
    text: '',
    highlightText: 'test',
  },
};
