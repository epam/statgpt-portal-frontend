import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequestLimitMessage } from '../RequestLimit';

describe('RequestLimitMessage', () => {
  it('calls onAdvancedViewClick when the refine link is clicked', () => {
    const onAdvancedViewClick = jest.fn();
    render(
      <RequestLimitMessage
        showAdvancedViewButton
        onAdvancedViewClick={onAdvancedViewClick}
        limitMessages={{ refineInAdvancedView: 'Refine in advanced view' }}
      />,
    );

    fireEvent.click(screen.getByText('Refine in advanced view'));

    expect(onAdvancedViewClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onAdvancedViewClick when advancedViewDisabled is true', () => {
    const onAdvancedViewClick = jest.fn();
    render(
      <RequestLimitMessage
        showAdvancedViewButton
        advancedViewDisabled
        onAdvancedViewClick={onAdvancedViewClick}
        limitMessages={{ refineInAdvancedView: 'Refine in advanced view' }}
      />,
    );

    fireEvent.click(screen.getByText('Refine in advanced view'));

    expect(onAdvancedViewClick).not.toHaveBeenCalled();
  });

  it('sets aria-disabled and dims the refine link when advancedViewDisabled is true', () => {
    render(
      <RequestLimitMessage
        showAdvancedViewButton
        advancedViewDisabled
        limitMessages={{ refineInAdvancedView: 'Refine in advanced view' }}
      />,
    );

    const link = screen.getByText('Refine in advanced view');

    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.className).toContain('cursor-not-allowed');
    expect(link.className).toContain('opacity-50');
  });

  it('does not set aria-disabled when advancedViewDisabled is not set', () => {
    render(
      <RequestLimitMessage
        showAdvancedViewButton
        limitMessages={{ refineInAdvancedView: 'Refine in advanced view' }}
      />,
    );

    const link = screen.getByText('Refine in advanced view');

    expect(link.getAttribute('aria-disabled')).toBeNull();
    expect(link.className).toContain('cursor-pointer');
  });

  it('does not render the refine link when showAdvancedViewButton is false', () => {
    render(
      <RequestLimitMessage
        limitMessages={{ refineInAdvancedView: 'Refine in advanced view' }}
      />,
    );

    expect(screen.queryByText('Refine in advanced view')).toBeNull();
  });
});
