import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders with icon', () => {
    const { getByRole } = render(
      <IconButton buttonClassName="test-class" icon={<span>ICON</span>} />,
    );
    expect(getByRole('button')).toBeInTheDocument();
    expect(getByRole('button').textContent).toContain('ICON');
  });

  it('applies custom and base class names', () => {
    const { getByRole } = render(<IconButton buttonClassName="custom-class" />);
    const button = getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('base-icon-button');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <IconButton buttonClassName="test" onClick={handleClick} />,
    );
    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByRole } = render(
      <IconButton buttonClassName="test" disabled />,
    );
    expect(getByRole('button')).toBeDisabled();
  });

  it('sets title attribute', () => {
    const { getByRole } = render(
      <IconButton buttonClassName="test" title="My Icon" />,
    );
    expect(getByRole('button')).toHaveAttribute('title', 'My Icon');
  });
});
