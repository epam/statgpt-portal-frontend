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

  describe('disabledScope', () => {
    it('applies opacity-50 to the label when disabled with default disabledScope', () => {
      const { container } = render(
        <Checkbox id="disabled-full" checked={false} disabled label="Label" />,
      );
      const label = container.querySelector('label');
      expect(label?.className).toContain('opacity-50');
    });

    it('applies opacity-50 to the label when disabled with disabledScope="full"', () => {
      const { container } = render(
        <Checkbox
          id="disabled-full-explicit"
          checked={false}
          disabled
          disabledScope="full"
          label="Label"
        />,
      );
      const label = container.querySelector('label');
      expect(label?.className).toContain('opacity-50');
    });

    it('does not apply opacity-50 to the label when disabled with disabledScope="icon"', () => {
      const { container } = render(
        <Checkbox
          id="disabled-icon"
          checked={false}
          disabled
          disabledScope="icon"
          label="Label"
        />,
      );
      const label = container.querySelector('label');
      expect(label?.className).not.toContain('opacity-50');
    });

    it('applies opacity-50 to the checkbox icon span when disabled with disabledScope="icon"', () => {
      const { container } = render(
        <Checkbox
          id="disabled-icon-span"
          checked={false}
          disabled
          disabledScope="icon"
        />,
      );
      const iconSpan = container.querySelector('.checkbox-button');
      expect(iconSpan?.className).toContain('opacity-50');
    });

    it('does not apply opacity-50 to the checkbox icon span when disabled with disabledScope="full"', () => {
      const { container } = render(
        <Checkbox
          id="disabled-full-span"
          checked={false}
          disabled
          disabledScope="full"
        />,
      );
      const iconSpan = container.querySelector('.checkbox-button');
      expect(iconSpan?.className).not.toContain('opacity-50');
    });

    it('applies cursor-not-allowed to the label for both disabledScope values', () => {
      const { container: fullContainer } = render(
        <Checkbox
          id="cursor-full"
          checked={false}
          disabled
          disabledScope="full"
        />,
      );
      const { container: iconContainer } = render(
        <Checkbox
          id="cursor-icon"
          checked={false}
          disabled
          disabledScope="icon"
        />,
      );
      expect(fullContainer.querySelector('label')?.className).toContain(
        'cursor-not-allowed',
      );
      expect(iconContainer.querySelector('label')?.className).toContain(
        'cursor-not-allowed',
      );
    });
  });
});
