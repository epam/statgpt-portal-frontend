import React from 'react';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders button', () => {
    render(<CopyButton onClick={jest.fn()} title="Copy" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();

    render(<CopyButton onClick={handleClick} title="Copy" />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows copied title and disables button after click', () => {
    render(
      <CopyButton onClick={jest.fn()} title="Copy" copiedTitle="Copied" />,
    );

    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(button).toBeDisabled();
  });

  it('returns to initial state after timeout', () => {
    render(
      <CopyButton onClick={jest.fn()} title="Copy" copiedTitle="Copied" />,
    );

    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(button).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(button).toBeEnabled();
  });

  it('shows tooltip only after click when tooltip prop is provided', () => {
    render(
      <CopyButton
        onClick={jest.fn()}
        title="Copy"
        copiedTitle="Copied"
        tooltip="Copied to clipboard"
      />,
    );

    expect(screen.queryByText('Copied to clipboard')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument();
  });

  it('hides tooltip after timeout', () => {
    render(
      <CopyButton
        onClick={jest.fn()}
        title="Copy"
        copiedTitle="Copied"
        tooltip="Copied to clipboard"
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Copied to clipboard')).not.toBeInTheDocument();
  });

  it('does not render tooltip if tooltip prop is not provided', () => {
    render(
      <CopyButton onClick={jest.fn()} title="Copy" copiedTitle="Copied" />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.queryByText('Copied to clipboard')).not.toBeInTheDocument();
  });

  it('applies custom class names', () => {
    render(
      <CopyButton
        onClick={jest.fn()}
        title="Copy"
        className="my-button-class"
      />,
    );

    expect(screen.getByRole('button')).toHaveClass('my-button-class');
  });
});
