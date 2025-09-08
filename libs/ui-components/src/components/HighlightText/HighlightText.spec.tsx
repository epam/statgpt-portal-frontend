import React from 'react';
import { render } from '@testing-library/react';
import { HighlightText } from './HighlightText';

describe('HighlightText', () => {
  it('renders plain text when no highlightText is provided', () => {
    const { getByText } = render(<HighlightText text="Hello World" />);
    expect(getByText('Hello World')).toBeInTheDocument();
  });

  it('highlights the matching text', () => {
    const { container } = render(
      <HighlightText text="Hello World" highlightText="World" />,
    );
    const highlighted = container.querySelector('.bg-highlight');
    expect(highlighted).toBeInTheDocument();
    expect(highlighted?.textContent).toBe('World');
  });

  it('highlights all occurrences (case-insensitive)', () => {
    const { container } = render(
      <HighlightText text="Hello world, world!" highlightText="WORLD" />,
    );
    const highlights = container.querySelectorAll('.bg-highlight');
    expect(highlights.length).toBe(2);
    expect(highlights[0].textContent).toBe('world');
    expect(highlights[1].textContent).toBe('world');
  });

  it('renders nothing if text is empty', () => {
    const { container } = render(<HighlightText text="" highlightText="a" />);
    expect(container.textContent).toBe('');
  });

  it('renders text without highlight if highlightText is not found', () => {
    const { getByText } = render(
      <HighlightText text="Hello" highlightText="xyz" />,
    );
    expect(getByText('Hello')).toBeInTheDocument();
    expect(getByText('Hello').className).not.toContain('bg-highlight');
  });
});
