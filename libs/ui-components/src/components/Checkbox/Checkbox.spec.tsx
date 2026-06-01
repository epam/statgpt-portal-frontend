import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders with label', () => {
    const { getByText } = render(
      <Checkbox id="test-checkbox" label="Test Label" checked={false} />,
    );
    expect(getByText('Test Label')).toBeInTheDocument();
  });

  it('renders checked state', () => {
    const { container } = render(
      <Checkbox id="checked-checkbox" checked={true} />,
    );
    const input = container.querySelector('input[type="checkbox"]');
    expect(input).toBeChecked();
  });

  it('calls onChange with correct arguments', () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Checkbox id="change-checkbox" checked={false} onChange={handleChange} />,
    );
    const input = container.querySelector('input[type="checkbox"]');
    fireEvent.click(input as Element);
    expect(handleChange).toHaveBeenCalledWith('change-checkbox', true);
  });

  it('renders custom icon when checked', () => {
    const icon = <span>ICON</span>;
    const { container } = render(
      <Checkbox id="icon-checkbox" checked={true} checkboxIcon={icon} />,
    );
    expect(container.textContent).toContain('ICON');
  });

  it('sets the native indeterminate state when indeterminate and not checked', () => {
    const { container } = render(
      <Checkbox id="indeterminate-checkbox" checked={false} indeterminate />,
    );
    const input = container.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
  });

  it('prefers the checked state over indeterminate', () => {
    const { container } = render(
      <Checkbox id="checked-indeterminate" checked={true} indeterminate />,
    );
    const input = container.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(input).toBeChecked();
    expect(input.indeterminate).toBe(false);
  });
});
