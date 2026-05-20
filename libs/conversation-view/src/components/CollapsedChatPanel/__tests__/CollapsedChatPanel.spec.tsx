import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CollapsedChatPanel } from '../CollapsedChatPanel';

describe('CollapsedChatPanel', () => {
  const defaultProps = {
    conversationName: 'Q3 Revenue Analysis',
    expandTitle: 'Expand',
    expandIcon: <span data-testid="expand-icon" />,
    onExpand: jest.fn(),
  };

  it('renders the conversation name', () => {
    render(<CollapsedChatPanel {...defaultProps} />);

    expect(screen.getByText('Q3 Revenue Analysis')).toBeTruthy();
  });

  it('renders empty title span when conversationName is undefined', () => {
    const { container } = render(
      <CollapsedChatPanel {...defaultProps} conversationName={undefined} />,
    );

    const span = container.querySelector('span.truncate');
    expect(span).toBeTruthy();
    expect(span?.textContent).toBe('');
  });

  it('renders the expand icon', () => {
    render(<CollapsedChatPanel {...defaultProps} />);

    expect(screen.getByTestId('expand-icon')).toBeTruthy();
  });

  it('calls onExpand when the expand button is clicked', () => {
    const onExpand = jest.fn();
    render(<CollapsedChatPanel {...defaultProps} onExpand={onExpand} />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('sets aria-label and title on the expand button', () => {
    render(<CollapsedChatPanel {...defaultProps} expandTitle="Open chat" />);

    const button = screen.getByRole('button', { name: 'Open chat' });
    expect(button.getAttribute('aria-label')).toBe('Open chat');
    expect(button.getAttribute('title')).toBe('Open chat');
  });
});
