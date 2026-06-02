import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { CalendarResolution } from '@epam/statgpt-shared-toolkit';
import 'flatpickr/dist/themes/light.css';
import 'flatpickr/dist/plugins/monthSelect/style.css';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
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

const monthOptions = {
  minDate: new Date(minDate.getFullYear(), minDate.getMonth()),
  maxDate: new Date(maxDate.getFullYear(), maxDate.getMonth()),
  dateFormat: 'M Y',
  plugins: [
    new (monthSelectPlugin as any)({ shorthand: true, dateFormat: 'M Y' }),
  ],
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

const InteractiveMonthCalendar = () => {
  const [value, setValue] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  return (
    <Calendar
      id="interactive-month-calendar"
      label="Select month"
      value={value}
      options={monthOptions}
      calendarResolution={CalendarResolution.MONTH}
      onChange={setValue}
    />
  );
};

export const MonthResolution: Story = {
  render: () => <InteractiveMonthCalendar />,
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
