import React from 'react';
import { render, screen } from '@testing-library/react';
import { DraggableListOverlay } from '../DraggableListOverlay';

describe('DraggableListOverlay', () => {
  it('renders label', () => {
    render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren={false}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    expect(screen.getByText('Dataset')).toBeTruthy();
  });

  it('renders drag handle when showDragHandle is true', () => {
    const { container } = render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren={false}
        showDragHandle
        showCheckbox={false}
      />,
    );

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(1);
  });

  it('does not render drag handle when showDragHandle is false', () => {
    const { container } = render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren={false}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders checkbox when showCheckbox is true', () => {
    render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren={false}
        showDragHandle={false}
        showCheckbox
        isChecked={false}
      />,
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.checked).toBe(false);
  });

  it('passes checked state to checkbox', () => {
    render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren={false}
        showDragHandle={false}
        showCheckbox
        isChecked
      />,
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('does not render checkbox when showCheckbox is false', () => {
    render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren={false}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('renders chevron when hasChildren is true', () => {
    const { container } = render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren
        showDragHandle={false}
        showCheckbox={false}
        isExpanded={false}
      />,
    );

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(1);
  });

  it('does not render chevron when hasChildren is false', () => {
    const { container } = render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren={false}
        showDragHandle={false}
        showCheckbox={false}
      />,
    );

    expect(container.querySelector('svg')).toBeNull();
  });

  it('applies rotate-90 class when expanded', () => {
    const { container } = render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren
        showDragHandle={false}
        showCheckbox={false}
        isExpanded
      />,
    );

    const chevronWrapper = container.querySelector(
      '.transition-transform',
    ) as HTMLElement;
    expect(chevronWrapper).toBeTruthy();
    expect(chevronWrapper.className).toContain('rotate-90');
    expect(chevronWrapper.className).not.toContain('rotate-0');
  });

  it('applies rotate-0 class when collapsed', () => {
    const { container } = render(
      <DraggableListOverlay
        label="Dataset"
        hasChildren
        showDragHandle={false}
        showCheckbox={false}
        isExpanded={false}
      />,
    );

    const chevronWrapper = container.querySelector(
      '.transition-transform',
    ) as HTMLElement;
    expect(chevronWrapper).toBeTruthy();
    expect(chevronWrapper.className).toContain('rotate-0');
    expect(chevronWrapper.className).not.toContain('rotate-90');
  });
});
