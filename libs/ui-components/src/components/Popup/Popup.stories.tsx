import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Popup } from './Popup';
import { PopUpSize, PopUpState } from '../../types/pop-up';

const meta: Meta<typeof Popup> = {
  title: 'UI Components/Overlays/Popup',
  component: Popup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Popup>;

interface PopupDemoProps {
  heading?: string;
  size?: PopUpSize;
  dividers?: boolean;
}

const PopupDemo = ({ heading, size, dividers }: PopupDemoProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="base-button text-button-primary px-4 py-2"
        onClick={() => setOpen(true)}
      >
        Open Popup
      </button>
      <Popup
        portalId="storybook-popup"
        state={open ? PopUpState.Opened : PopUpState.Closed}
        heading={heading ?? 'Dialog Title'}
        size={size}
        dividers={dividers}
        onClose={() => setOpen(false)}
        closeButtonTitle="Close"
      >
        <div className="body-2 p-6 text-neutrals-900">
          <p>This is the popup body content.</p>
          <p className="mt-2">Press Escape or click outside to dismiss.</p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4">
          <button
            className="base-button text-button-secondary px-4 py-2"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            className="base-button text-button-primary px-4 py-2"
            onClick={() => setOpen(false)}
          >
            Confirm
          </button>
        </div>
      </Popup>
    </>
  );
};

export const Default: Story = {
  render: () => <PopupDemo />,
};

export const Large: Story = {
  render: () => <PopupDemo size={PopUpSize.LG} />,
};

export const Small: Story = {
  render: () => <PopupDemo size={PopUpSize.SM} />,
};

export const WithoutDividers: Story = {
  name: 'Without Dividers',
  render: () => <PopupDemo dividers={false} />,
};

export const WithoutHeading: Story = {
  name: 'Without Heading',
  render: () => <PopupDemo heading={undefined} />,
};
