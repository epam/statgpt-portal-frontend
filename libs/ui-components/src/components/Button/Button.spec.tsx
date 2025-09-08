import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(
      <Button buttonClassName="primary" title="Click me" />,
    );
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <Button buttonClassName="primary" title="Click" onClick={handleClick} />,
    );
    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByRole } = render(
      <Button buttonClassName="primary" title="Disabled" disabled />,
    );
    expect(getByRole('button')).toBeDisabled();
  });

  it('shows loader when isLoading is true', () => {
    const { container } = render(
      <Button buttonClassName="primary" title="Loading" isLoading />,
    );
    // Loader should be rendered
    expect(container.querySelector('.loader')).toBeInTheDocument();
  });

  it('renders iconBefore and iconAfter', () => {
    const { container } = render(
      <Button
        buttonClassName="primary"
        title="With Icons"
        iconBefore={<span>Before</span>}
        iconAfter={<span>After</span>}
      />,
    );
    expect(container.textContent).toContain('Before');
    expect(container.textContent).toContain('After');
  });
});
