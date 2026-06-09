import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconCircleFilled } from '@tabler/icons-react';
import { useId, useState } from 'react';

import { Radio } from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'UI Components/Form/Radio',
  component: Radio,
  tags: ['autodocs'],
  args: {
    label: 'Radio label',
    radioIcon: <IconCircleFilled className="size-3" />,
  },
};

export default meta;
type Story = StoryObj<typeof Radio>;

const InteractiveRadio = () => {
  const id = useId();
  const [checked, setChecked] = useState(false);
  return (
    <Radio
      id={id}
      label="Radio label"
      checked={checked}
      radioIcon={<IconCircleFilled className="size-3" />}
      onChange={(_, isChecked) => setChecked(isChecked ?? !checked)}
    />
  );
};

export const Interactive: Story = { render: () => <InteractiveRadio /> };

export const Unchecked: Story = {
  args: { id: 'radio-unchecked', checked: false },
};

export const Checked: Story = {
  args: { id: 'radio-checked', checked: true },
};

export const WithDescription: Story = {
  args: {
    id: 'radio-description',
    checked: false,
    description: 'Additional details about this option',
  },
};

export const CheckedWithDescription: Story = {
  args: {
    id: 'radio-checked-description',
    checked: true,
    description: 'Additional details about this option',
  },
};

export const WithoutLabel: Story = {
  name: 'Without Label',
  args: { id: 'radio-no-label', checked: false, label: undefined },
};
