import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FiltersSearchInput } from '../FiltersSearchInput';

jest.mock('@epam/statgpt-ui-components', () => ({
  InputWithIcon: ({ value, onChange, onFocus, onBlur, placeholder }: any) => (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  ),
}));

jest.mock('@tabler/icons-react', () => ({
  IconSearch: () => null,
}));

const mockUseConversationViewStyles = jest.fn();
const mockUseConversationViewFeatureToggles = jest.fn();

jest.mock('../../../../../../context/ConversationViewStylesContext', () => ({
  useConversationViewStyles: (...args: any[]) =>
    mockUseConversationViewStyles(...args),
}));

jest.mock(
  '../../../../../../context/ConversationViewFeatureTogglesContext',
  () => ({
    useConversationViewFeatureToggles: (...args: any[]) =>
      mockUseConversationViewFeatureToggles(...args),
  }),
);

const renderInput = (
  props: Partial<React.ComponentProps<typeof FiltersSearchInput>> = {},
  isCrossDatasetModeOn = false,
) => {
  mockUseConversationViewStyles.mockReturnValue({ titles: {} });
  mockUseConversationViewFeatureToggles.mockReturnValue({
    isCrossDatasetModeOn,
  });
  return render(
    <FiltersSearchInput value="" onChange={jest.fn()} {...props} />,
  );
};

describe('FiltersSearchInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search input', () => {
    renderInput();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onChange with the new value when input changes', () => {
    const onChange = jest.fn();
    renderInput({ onChange });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('does not render the caption when isCrossDatasetModeOn is false', () => {
    renderInput({}, false);
    expect(
      screen.queryByText('Enter at least 2 characters to start searching'),
    ).not.toBeInTheDocument();
  });

  it('renders caption as invisible when isCrossDatasetModeOn is true and input is not focused', () => {
    renderInput({}, true);
    expect(
      screen.getByText('Enter at least 2 characters to start searching'),
    ).toHaveClass('invisible');
  });

  it('makes caption visible when input is focused with fewer than 2 characters', () => {
    renderInput({ value: 'a' }, true);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(
      screen.getByText('Enter at least 2 characters to start searching'),
    ).not.toHaveClass('invisible');
  });

  it('keeps caption invisible when input is focused with 2 or more characters', () => {
    renderInput({ value: 'ab' }, true);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(
      screen.getByText('Enter at least 2 characters to start searching'),
    ).toHaveClass('invisible');
  });

  it('returns caption to invisible after blur', () => {
    renderInput({ value: 'a' }, true);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(
      screen.getByText('Enter at least 2 characters to start searching'),
    ).toHaveClass('invisible');
  });

  it('uses searchPlaceholder from titles as input placeholder', () => {
    mockUseConversationViewStyles.mockReturnValue({
      titles: { searchPlaceholder: 'Find something' },
    });
    mockUseConversationViewFeatureToggles.mockReturnValue({
      isCrossDatasetModeOn: false,
    });
    render(<FiltersSearchInput value="" onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Find something')).toBeInTheDocument();
  });

  it('uses searchMinCharsCaption from titles for the caption text', () => {
    mockUseConversationViewStyles.mockReturnValue({
      titles: { searchMinCharsCaption: 'Type to search' },
    });
    mockUseConversationViewFeatureToggles.mockReturnValue({
      isCrossDatasetModeOn: true,
    });
    render(<FiltersSearchInput value="" onChange={jest.fn()} />);
    expect(screen.getByText('Type to search')).toBeInTheDocument();
  });
});
