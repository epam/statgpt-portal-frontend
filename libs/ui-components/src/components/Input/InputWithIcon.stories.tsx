import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconSearch, IconSend, IconX } from '@tabler/icons-react';
import { useId, useState } from 'react';

import { IconButton } from '../IconButton/IconButton';
import { InputWithIcon } from './InputWithIcon';

const meta: Meta<typeof InputWithIcon> = {
  title: 'UI Components/Form/InputWithIcon',
  component: InputWithIcon,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InputWithIcon>;

const InteractiveInputWithIcon = () => {
  const id = useId();
  const [value, setValue] = useState('');
  return (
    <InputWithIcon
      inputId={id}
      value={value}
      onChange={setValue}
      placeholder="Search..."
      iconBeforeInput={
        <IconSearch className="shrink-0 self-center" size={16} />
      }
      iconAfterInput={
        value ? <IconX className="shrink-0 self-center" size={16} /> : undefined
      }
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveInputWithIcon />,
};

export const WithIconBefore: Story = {
  args: {
    inputId: 'iwi-before',
    value: '',
    placeholder: 'Search...',
    iconBeforeInput: <IconSearch className="shrink-0 self-center" size={16} />,
  },
};

export const WithIconAfter: Story = {
  args: {
    inputId: 'iwi-after',
    value: 'Some input',
    iconAfterInput: <IconX className="shrink-0 self-center" size={16} />,
  },
};

export const WithBothIcons: Story = {
  args: {
    inputId: 'iwi-both',
    value: 'Query text',
    iconBeforeInput: <IconSearch className="shrink-0 self-center" size={16} />,
    iconAfterInput: <IconX className="shrink-0 self-center" size={16} />,
  },
};

export const Disabled: Story = {
  args: {
    inputId: 'iwi-disabled',
    value: 'Disabled input',
    disabled: true,
    iconBeforeInput: <IconSearch className="shrink-0 self-center" size={16} />,
  },
};

const ChatInput = () => {
  const id = useId();
  const [value, setValue] = useState('');
  return (
    <InputWithIcon
      inputId={id}
      value={value}
      onChange={setValue}
      placeholder="Ask a question..."
      cssClass="input-for-ask"
      iconAfterInput={
        value ? (
          <IconButton
            buttonClassName="input-for-ask-button"
            icon={<IconSend />}
            onClick={() => setValue('')}
          />
        ) : undefined
      }
    />
  );
};

export const ChatInputVariant: Story = { render: () => <ChatInput /> };
