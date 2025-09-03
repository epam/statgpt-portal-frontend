import { PopUpState } from '@statgpt/ui-components/src/types/pop-up';
import { render } from '@testing-library/react';
import Popup from './Popup';

jest.mock('@statgpt/locales/src/client', () => ({
  useI18n: () => (key: string) => key,
}));

describe('Popup', () => {
  it('renders heading and children when open', () => {
    const { getByText } = render(
      <Popup
        portalId="test-portal"
        heading="Test Heading"
        state={PopUpState.Opened}
        onClose={jest.fn()}
      >
        <div>Child 1</div>
        <div>Child 2</div>
      </Popup>,
    );
    expect(getByText('Test Heading')).toBeInTheDocument();
    expect(getByText('Child 1')).toBeInTheDocument();
    expect(getByText('Child 2')).toBeInTheDocument();
  });

  it('does not render when state is Closed', () => {
    const { queryByText } = render(
      <Popup
        portalId="test-portal"
        heading="Test Heading"
        state={PopUpState.Closed}
        onClose={jest.fn()}
      >
        <div>Child 1</div>
        <div>Child 2</div>
      </Popup>,
    );
    expect(queryByText('Test Heading')).not.toBeInTheDocument();
    expect(queryByText('Child 1')).not.toBeInTheDocument();
    expect(queryByText('Child 2')).not.toBeInTheDocument();
  });
});
