import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
  it('renders with default props', () => {
    const { getByPlaceholderText } = render(
      <Input inputId="test-input" placeholder="Enter text" />,
    );
    expect(getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    const { getByPlaceholderText } = render(
      <Input
        inputId="test-input"
        placeholder="Type here"
        onChange={handleChange}
      />,
    );
    const input = getByPlaceholderText('Type here');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalledWith('hello');
  });

  it('calls onKeyDown when a key is pressed', () => {
    const handleKeyDown = jest.fn();
    const { getByPlaceholderText } = render(
      <Input
        inputId="test-input"
        placeholder="Type here"
        onKeyDown={handleKeyDown}
      />,
    );
    const input = getByPlaceholderText('Type here');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(handleKeyDown).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByPlaceholderText } = render(
      <Input inputId="test-input" placeholder="Disabled" disabled />,
    );
    const input = getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
  });

  it('is readonly when readonly prop is true', () => {
    const { getByPlaceholderText } = render(
      <Input inputId="test-input" placeholder="Readonly" readonly />,
    );
    const input = getByPlaceholderText('Readonly');
    expect(input).toHaveClass('pointer-events-none');
  });
});
