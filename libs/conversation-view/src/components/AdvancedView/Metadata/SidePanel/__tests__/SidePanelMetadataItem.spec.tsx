import { fireEvent, render, screen } from '@testing-library/react';
import { SidePanelMetadataItem } from '../SidePanelMetadataItem';

jest.mock('../../../../../assets/icons/chevron-solid-down.svg', () => ({
  __esModule: true,
  default: () => <svg data-testid="chevron" />,
}));

function setMeasurements(scrollHeight: number, offsetHeight: number) {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => offsetHeight,
  });
}

describe('SidePanelMetadataItem', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders title and value', () => {
    setMeasurements(0, 0);
    render(<SidePanelMetadataItem title="Full Description" value="A note" />);

    expect(screen.getByText('Full Description')).toBeTruthy();
    expect(screen.getByText('A note')).toBeTruthy();
  });

  it('renders attached key titles', () => {
    setMeasurements(0, 0);
    render(
      <SidePanelMetadataItem
        title="Attr"
        value="v"
        attachedKeysTitles={['Country: US']}
      />,
    );

    expect(screen.getByText('Country: US')).toBeTruthy();
  });

  it('clamps and expands long values', () => {
    setMeasurements(200, 80);
    render(
      <SidePanelMetadataItem title="Full Description" value="Very long text" />,
    );

    const value = screen.getByText('Very long text');
    expect(value.className).toContain('line-clamp-4');

    fireEvent.click(screen.getByRole('button'));
    expect(value.className).not.toContain('line-clamp-4');
  });

  it('shows no toggle for short values', () => {
    setMeasurements(40, 40);
    render(<SidePanelMetadataItem title="Agency" value="IMF" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
