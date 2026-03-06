import React from 'react';
import { render, screen } from '@testing-library/react';
import { InlineAlert } from './InlineAlert';
import { InlineAlertProvider } from './InlineAlertContext';
import { InlineAlertType } from './types';

describe('InlineAlert', () => {
  it('renders children', () => {
    render(<InlineAlert type={InlineAlertType.Info}>Hello</InlineAlert>);

    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('does not render content wrapper when children is not provided', () => {
    const { container } = render(<InlineAlert type={InlineAlertType.Info} />);

    expect(container.querySelector('[data-type="info"]')).toBeTruthy();
    expect(container.querySelector('[data-type="info"] > div')).toBeNull();
  });

  it('sets data-type attribute', () => {
    const { container } = render(
      <InlineAlert type={InlineAlertType.Warning}>Test</InlineAlert>,
    );

    const root = container.querySelector('[data-type="warning"]');
    expect(root).toBeTruthy();
  });

  it('renders icon prop when provided', () => {
    render(
      <InlineAlert
        type={InlineAlertType.Info}
        icon={<span data-testid="icon">I</span>}
      >
        Text
      </InlineAlert>,
    );

    expect(screen.getByTestId('icon')).toBeTruthy();
  });

  it('uses provider icon when icon prop is not provided', () => {
    render(
      <InlineAlertProvider
        value={{
          icons: {
            [InlineAlertType.Error]: <span data-testid="cfg-icon">CFG</span>,
          },
        }}
      >
        <InlineAlert type={InlineAlertType.Error}>Text</InlineAlert>
      </InlineAlertProvider>,
    );

    expect(screen.getByTestId('cfg-icon')).toBeTruthy();
  });

  it('icon prop overrides provider icon', () => {
    render(
      <InlineAlertProvider
        value={{
          icons: {
            [InlineAlertType.Error]: <span data-testid="cfg-icon">CFG</span>,
          },
        }}
      >
        <InlineAlert
          type={InlineAlertType.Error}
          icon={<span data-testid="prop-icon">PROP</span>}
        >
          Text
        </InlineAlert>
      </InlineAlertProvider>,
    );

    expect(screen.getByTestId('prop-icon')).toBeTruthy();
    expect(screen.queryByTestId('cfg-icon')).toBeNull();
  });

  it('applies provider class overrides and allows instance className/contentClassName', () => {
    const { container } = render(
      <InlineAlertProvider
        value={{
          classes: {
            container: 'p-4 gap-3',
            types: {
              [InlineAlertType.Info]: 'bg-blue-50',
            },
            icon: 'w-6',
            content: 'text-sm',
          },
        }}
      >
        <InlineAlert
          type={InlineAlertType.Info}
          icon={<span data-testid="icon">I</span>}
          className="p-2"
          contentClassName="text-lg"
        >
          Text
        </InlineAlert>
      </InlineAlertProvider>,
    );

    const root = container.querySelector('[data-type="info"]') as HTMLElement;
    expect(root).toBeTruthy();

    expect(root.className).toContain('gap-3');
    expect(root.className).toContain('bg-blue-50');
    expect(root.className).toContain('p-2');

    const iconWrapper = screen.getByTestId('icon').parentElement as HTMLElement;
    expect(iconWrapper.className).toContain('w-6');

    const contentWrapper = screen.getByText('Text') as HTMLElement;
    expect(contentWrapper.className).toContain('text-lg');
    expect(contentWrapper.className).not.toContain('text-sm');
  });

  it('InlineAlertProvider works with omitted value', () => {
    render(
      <InlineAlertProvider>
        <InlineAlert type={InlineAlertType.Info}>Text</InlineAlert>
      </InlineAlertProvider>,
    );

    expect(screen.getByText('Text')).toBeTruthy();
  });
});
