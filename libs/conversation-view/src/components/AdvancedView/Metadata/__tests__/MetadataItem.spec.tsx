import { fireEvent, render, screen } from '@testing-library/react';
import MetadataItem from '../MetadataItem';

jest.mock('../../../../assets/icons/chevron-solid-down.svg', () => ({
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

describe('MetadataItem', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title and value', () => {
    setMeasurements(0, 0);
    render(
      <MetadataItem
        title="Full Description"
        value="A short note"
        locale="en"
      />,
    );

    expect(screen.getByText('Full Description')).toBeTruthy();
    expect(screen.getByText('A short note')).toBeTruthy();
  });

  it('shows no toggle when the value fits', () => {
    setMeasurements(40, 40);
    render(<MetadataItem title="Full Description" value="Short" locale="en" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows a toggle when the value overflows and expands on click', () => {
    setMeasurements(200, 80);
    render(
      <MetadataItem
        title="Full Description"
        value="Very long text"
        locale="en"
      />,
    );

    const value = screen.getByText('Very long text');
    expect(value.className).toContain('line-clamp-4');

    fireEvent.click(screen.getByRole('button'));
    expect(value.className).not.toContain('line-clamp-4');
  });

  it('renders attached key titles', () => {
    setMeasurements(0, 0);
    render(
      <MetadataItem
        title="Attr"
        value="v"
        locale="en"
        attachedKeysTitles={['Country: US']}
      />,
    );

    expect(screen.getByText('Country: US')).toBeTruthy();
  });

  it('hides attached key titles for dimensionGroup attributes', () => {
    setMeasurements(0, 0);
    render(
      <MetadataItem
        title="Attr"
        value="v"
        locale="en"
        attachedKeysTitles={['Country: US']}
        isDimensionGroup
      />,
    );

    expect(screen.queryByText('Country: US')).toBeNull();
  });

  it('joins array values with the locale', () => {
    setMeasurements(0, 0);
    render(
      <MetadataItem
        title="Keywords"
        value={[{ en: 'A' }, { en: 'B' }] as unknown as string[]}
        locale="en"
      />,
    );

    expect(screen.getByText('A, B')).toBeTruthy();
  });
});
