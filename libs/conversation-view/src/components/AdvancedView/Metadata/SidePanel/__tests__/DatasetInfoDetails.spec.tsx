import { render, screen } from '@testing-library/react';
import DatasetInfoDetails from '../DatasetInfoDetails';
import { DatasetInfoDetailsProvider } from '../DatasetInfoDetailsContext';
import { StructureComponentValue } from '../../../../../models/structure-component';

const formatValue = (value: StructureComponentValue['value']) =>
  String(value ?? '');

const dataset = { value: 'GDP', title: 'Dataset' } as StructureComponentValue;

describe('DatasetInfoDetails', () => {
  it('renders the default dataset icon and native external-link anchor with no provider', () => {
    const { container } = render(
      <DatasetInfoDetails
        dataset={dataset}
        externalLink="https://example.com/dataset"
        formatValue={formatValue}
      />,
    );

    const anchor = container.querySelector('a');
    expect(anchor).toBeTruthy();
    expect(anchor?.getAttribute('href')).toBe('https://example.com/dataset');
    expect(anchor?.getAttribute('target')).toBe('_blank');
  });

  it('does not render any external link element when externalLink is not provided', () => {
    const { container } = render(
      <DatasetInfoDetails dataset={dataset} formatValue={formatValue} />,
    );

    expect(container.querySelector('a')).toBeNull();
  });

  it('renders a custom dataset icon from provider config', () => {
    render(
      <DatasetInfoDetailsProvider
        value={{ icon: <span data-testid="custom-icon">icon</span> }}
      >
        <DatasetInfoDetails dataset={dataset} formatValue={formatValue} />
      </DatasetInfoDetailsProvider>,
    );

    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });

  it('renders a custom externalLink component with the correct url prop instead of the default anchor', () => {
    function CustomLink({ url }: { url: string }) {
      return <button type="button" data-testid="custom-link" data-url={url} />;
    }

    const { container } = render(
      <DatasetInfoDetailsProvider value={{ externalLink: CustomLink }}>
        <DatasetInfoDetails
          dataset={dataset}
          externalLink="https://example.com/dataset"
          formatValue={formatValue}
        />
      </DatasetInfoDetailsProvider>,
    );

    expect(container.querySelector('a')).toBeNull();
    const link = screen.getByTestId('custom-link');
    expect(link.getAttribute('data-url')).toBe('https://example.com/dataset');
  });
});
