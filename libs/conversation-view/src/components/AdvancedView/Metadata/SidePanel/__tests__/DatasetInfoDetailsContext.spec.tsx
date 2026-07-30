import { render, screen } from '@testing-library/react';
import {
  DatasetInfoDetailsProvider,
  useDatasetInfoDetailsConfig,
} from '../DatasetInfoDetailsContext';

function ConfigProbe() {
  const config = useDatasetInfoDetailsConfig();
  return (
    <div data-testid="probe">
      {config === null ? 'null' : JSON.stringify(Object.keys(config))}
    </div>
  );
}

describe('DatasetInfoDetailsContext', () => {
  it('returns null outside a provider', () => {
    render(<ConfigProbe />);
    expect(screen.getByTestId('probe').textContent).toBe('null');
  });

  it('returns the supplied value inside a provider', () => {
    render(
      <DatasetInfoDetailsProvider value={{ icon: <span>icon</span> }}>
        <ConfigProbe />
      </DatasetInfoDetailsProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe(
      JSON.stringify(['icon']),
    );
  });

  it('defaults to an empty object when value is omitted', () => {
    render(
      <DatasetInfoDetailsProvider>
        <ConfigProbe />
      </DatasetInfoDetailsProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe(JSON.stringify([]));
  });
});
