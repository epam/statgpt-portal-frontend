import { fireEvent, render, screen } from '@testing-library/react';
import { ConversationViewSidePanel } from '../ConversationViewSidePanel';
import { SidePanelCustomizationProvider } from '../SidePanelCustomizationContext';

describe('ConversationViewSidePanel', () => {
  it('renders the default close button and calls onClose when no provider is present', () => {
    const onClose = jest.fn();
    render(
      <ConversationViewSidePanel title="Details" onClose={onClose}>
        <p>Body</p>
      </ConversationViewSidePanel>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a custom closeControl from provider config instead of the default button', () => {
    const onClose = jest.fn();
    function CustomClose({ onClose }: { onClose: () => void }) {
      return (
        <button type="button" onClick={onClose} data-testid="custom-close">
          Dismiss
        </button>
      );
    }

    render(
      <SidePanelCustomizationProvider value={{ closeControl: CustomClose }}>
        <ConversationViewSidePanel title="Details" onClose={onClose}>
          <p>Body</p>
        </ConversationViewSidePanel>
      </SidePanelCustomizationProvider>,
    );

    fireEvent.click(screen.getByTestId('custom-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('merges provider classes.panel under the default panel classes, with panelClassName prop still winning', () => {
    const { container, rerender } = render(
      <SidePanelCustomizationProvider value={{ classes: { panel: 'w-full' } }}>
        <ConversationViewSidePanel title="Details" onClose={() => {}}>
          <p>Body</p>
        </ConversationViewSidePanel>
      </SidePanelCustomizationProvider>,
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('w-full');
    expect(panel.className).not.toContain('w-[362px]');

    rerender(
      <SidePanelCustomizationProvider value={{ classes: { panel: 'w-full' } }}>
        <ConversationViewSidePanel
          title="Details"
          onClose={() => {}}
          panelClassName="w-[480px]"
        >
          <p>Body</p>
        </ConversationViewSidePanel>
      </SidePanelCustomizationProvider>,
    );

    const panelAfter = container.firstChild as HTMLElement;
    expect(panelAfter.className).toContain('w-[480px]');
    expect(panelAfter.className).not.toContain('w-full');
  });
});
