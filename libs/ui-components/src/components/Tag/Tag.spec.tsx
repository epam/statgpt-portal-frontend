import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Tag from './Tag';

describe('Tag', () => {
  it('renders with title', () => {
    const { getByText } = render(<Tag title="My Tag" />);
    expect(getByText('My Tag')).toBeInTheDocument();
  });

  it('calls onClick with text if provided', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <Tag title="My Tag" text="Tag Text" onClick={handleClick} />,
    );
    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('Tag Text');
  });

  it('calls onClick with title if text is not provided', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(<Tag title="My Tag" onClick={handleClick} />);
    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('My Tag');
  });

  it('button has class "tag"', () => {
    const { getByRole } = render(<Tag title="Class Test" />);
    expect(getByRole('button')).toHaveClass('tag');
  });
});
