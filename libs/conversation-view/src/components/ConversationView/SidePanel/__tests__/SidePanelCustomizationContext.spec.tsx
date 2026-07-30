import { render, screen } from '@testing-library/react';
import {
  SidePanelCustomizationProvider,
  useSidePanelCustomizationConfig,
} from '../SidePanelCustomizationContext';

function ConfigProbe() {
  const config = useSidePanelCustomizationConfig();
  return (
    <div data-testid="probe">
      {config === null ? 'null' : JSON.stringify(Object.keys(config))}
    </div>
  );
}

describe('SidePanelCustomizationContext', () => {
  it('returns null outside a provider', () => {
    render(<ConfigProbe />);
    expect(screen.getByTestId('probe').textContent).toBe('null');
  });

  it('returns the supplied value inside a provider', () => {
    const closeControl = () => null;
    render(
      <SidePanelCustomizationProvider value={{ closeControl }}>
        <ConfigProbe />
      </SidePanelCustomizationProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe(
      JSON.stringify(['closeControl']),
    );
  });

  it('defaults to an empty object when value is omitted', () => {
    render(
      <SidePanelCustomizationProvider>
        <ConfigProbe />
      </SidePanelCustomizationProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe(JSON.stringify([]));
  });
});
