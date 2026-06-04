import { fireEvent, render, screen } from '@testing-library/react';
import { ExpandToggleButton } from '../ExpandToggleButton';

jest.mock('../../../../assets/icons/chevron-solid-down.svg', () => ({
  __esModule: true,
  default: () => <svg data-testid="chevron" />,
}));

describe('ExpandToggleButton', () => {
  it('calls onToggle when clicked', () => {
    const onToggle = jest.fn();
    render(<ExpandToggleButton isExpanded={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('rotates the chevron when expanded', () => {
    render(<ExpandToggleButton isExpanded onToggle={jest.fn()} />);

    expect(screen.getByRole('button').className).toContain('rotate-[180deg]');
  });

  it('does not rotate the chevron when collapsed', () => {
    render(<ExpandToggleButton isExpanded={false} onToggle={jest.fn()} />);

    expect(screen.getByRole('button').className).not.toContain(
      'rotate-[180deg]',
    );
  });
});
