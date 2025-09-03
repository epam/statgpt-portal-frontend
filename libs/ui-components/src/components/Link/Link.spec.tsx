import React from 'react';
import { render } from '@testing-library/react';
import Link from './Link';

describe('Link', () => {
  it('renders with title and url', () => {
    const { getByText } = render(
      <Link url="https://example.com" title="Example" />,
    );
    const link = getByText('Example').closest('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Link url="#" title="Test" linkClassName="custom-class" />,
    );
    const link = container.querySelector('a');
    expect(link).toHaveClass('base-link');
    expect(link).toHaveClass('custom-class');
  });

  it('renders iconBefore and iconAfter', () => {
    const before = <span>Before</span>;
    const after = <span>After</span>;
    const { container } = render(
      <Link url="#" title="Icons" iconBefore={before} iconAfter={after} />,
    );
    expect(container.textContent).toContain('Before');
    expect(container.textContent).toContain('After');
  });
});
