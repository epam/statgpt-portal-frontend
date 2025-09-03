import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CloseButton from './CloseButton';

jest.mock('@statgpt/locales/src/client', () => ({
  useI18n: () => (key: string) => key,
}));

describe('CloseButton', () => {
  it('renders button with icon', () => {
    const { getByRole } = render(<CloseButton />);
    const button = getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('applies custom class names', () => {
    const { getByRole } = render(<CloseButton btnClassNames="my-class" />);
    expect(getByRole('button')).toHaveClass('my-class');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(<CloseButton onClick={handleClick} />);
    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('sets icon size from props', () => {
    const { container } = render(
      <CloseButton iconWidth={32} iconHeight={32} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });
});
