import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { CalendarResolution } from '@epam/statgpt-shared-toolkit';
import { Calendar } from './Calendar';

const today = new Date();
const minDate = new Date(today.getFullYear() - 1, 0, 1);
const maxDate = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate(),
);

const dayOptions = {
  minDate,
  maxDate,
  monthSelectorType: 'static' as const,
};

const withTopRoom = (Story: React.ComponentType) => (
  <div style={{ paddingTop: '320px' }}>
    <Story />
  </div>
);

const meta: Meta<typeof Calendar> = {
  title: 'UI Components/Form/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  decorators: [withTopRoom],
  args: {
    label: 'Select date',
    options: dayOptions,
  },
  parameters: {
    docs: {
      story: { inline: false, height: '420px' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

const InteractiveCalendar = () => {
  const [value, setValue] = useState(today);
  return (
    <Calendar
      id="interactive-calendar"
      label="Select date"
      value={value}
      options={dayOptions}
      onChange={setValue}
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveCalendar />,
};

export const DayResolution: Story = {
  args: {
    id: 'day-resolution',
    value: today,
    calendarResolution: CalendarResolution.DAY,
    onChange: () => {},
  },
};

export const EndDate: Story = {
  args: {
    id: 'end-date-calendar',
    label: 'End date',
    value: today,
    options: dayOptions,
    isEndDate: true,
    onChange: () => {},
  },
};
