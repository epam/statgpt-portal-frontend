import { render, screen } from '@testing-library/react';
import {
  MetadataCellIconProvider,
  useMetadataCellIconConfig,
} from '../MetadataCellIconContext';

function ConfigProbe() {
  const config = useMetadataCellIconConfig();
  return (
    <div data-testid="probe">
      {config === null ? 'null' : JSON.stringify(Object.keys(config))}
    </div>
  );
}

describe('MetadataCellIconContext', () => {
  it('returns null outside a provider', () => {
    render(<ConfigProbe />);
    expect(screen.getByTestId('probe').textContent).toBe('null');
  });

  it('returns the supplied value inside a provider', () => {
    render(
      <MetadataCellIconProvider value={{ icon: <span>icon</span> }}>
        <ConfigProbe />
      </MetadataCellIconProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe(
      JSON.stringify(['icon']),
    );
  });

  it('defaults to an empty object when value is omitted', () => {
    render(
      <MetadataCellIconProvider>
        <ConfigProbe />
      </MetadataCellIconProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe(JSON.stringify([]));
  });
});
