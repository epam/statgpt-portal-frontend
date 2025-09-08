import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { InputWithIcon } from '../InputWithIcon';

describe('InputWithIcon', () => {
  it('renders input with placeholder', () => {
    const { getByPlaceholderText } = render(
      <InputWithIcon inputId="icon-input" placeholder="With icon" />,
    );
    expect(getByPlaceholderText('With icon')).toBeInTheDocument();
  });

  it('renders iconBeforeInput and iconAfterInput', () => {
    const before = <span>B</span>;
    const after = <span>A</span>;
    const { container } = render(
      <InputWithIcon
        inputId="icon-input"
        placeholder="With icon"
        iconBeforeInput={before}
        iconAfterInput={after}
      />,
    );
    // Check for the text content of the icons
    expect(container.textContent).toContain('B');
    expect(container.textContent).toContain('A');
  });

  it('calls onChange when input changes', () => {
    const handleChange = jest.fn();
    const { getByPlaceholderText } = render(
      <InputWithIcon
        inputId="icon-input"
        placeholder="Type here"
        onChange={handleChange}
      />,
    );
    const input = getByPlaceholderText('Type here');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledWith('test');
  });

  it('applies containerClasses', () => {
    const { container } = render(
      <InputWithIcon
        inputId="icon-input"
        placeholder="Test"
        containerClasses="custom-class"
      />,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
