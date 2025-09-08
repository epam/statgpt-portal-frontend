import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Radio } from './Radio';

describe('Radio', () => {
  it('renders with label', () => {
    const { getByText } = render(
      <Radio id="radio1" label="Option 1" checked={false} />,
    );
    expect(getByText('Option 1')).toBeInTheDocument();
  });

  it('renders checked state', () => {
    const { container } = render(<Radio id="radio2" checked={true} />);
    const input = container.querySelector('input[type="radio"]');
    expect(input).toBeChecked();
  });

  it('calls onChange with correct arguments', () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Radio id="radio3" checked={false} onChange={handleChange} />,
    );
    const input = container.querySelector('input[type="radio"]');
    fireEvent.click(input as Element);
    expect(handleChange).toHaveBeenCalledWith('radio3', true);
  });

  it('renders custom radioIcon when checked', () => {
    const icon = <span>ICON</span>;
    const { container } = render(
      <Radio id="radio4" checked={true} radioIcon={icon} />,
    );
    expect(container.textContent).toContain('ICON');
  });
});
