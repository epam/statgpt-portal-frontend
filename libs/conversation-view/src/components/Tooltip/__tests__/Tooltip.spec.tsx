import React, { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Tooltip } from '../Tooltip';
import { OnboardingProvider } from '../../../context/OnboardingContext';

// FloatingPortal renders into document.body, not the render() container.
const getOverlay = () =>
  document.body.querySelector('.outline-block') as HTMLElement;

const TooltipHarness = ({
  onReferenceClick,
  disabled,
}: {
  onReferenceClick?: () => void;
  disabled?: boolean;
}) => {
  const reference = useRef<HTMLDivElement>(null);
  return (
    <OnboardingProvider>
      <div ref={reference}>Target</div>
      <Tooltip
        reference={reference}
        title="Title"
        description="Description"
        onReferenceClick={onReferenceClick}
        disabled={disabled}
      />
    </OnboardingProvider>
  );
};

describe('Tooltip', () => {
  it('calls onReferenceClick when the overlay is clicked', () => {
    const onReferenceClick = jest.fn();
    render(<TooltipHarness onReferenceClick={onReferenceClick} />);

    fireEvent.click(getOverlay());

    expect(onReferenceClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onReferenceClick when disabled is true', () => {
    const onReferenceClick = jest.fn();
    render(<TooltipHarness onReferenceClick={onReferenceClick} disabled />);

    fireEvent.click(getOverlay());

    expect(onReferenceClick).not.toHaveBeenCalled();
  });
});
