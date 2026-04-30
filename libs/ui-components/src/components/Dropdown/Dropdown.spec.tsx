import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Dropdown } from './Dropdown';

describe('Dropdown', () => {
  it('closes previously opened dropdown when another dropdown opens', async () => {
    const { getByText, queryByText } = render(
      <>
        <Dropdown
          triggerButton={<button type="button">Open first</button>}
          options={[{ key: 'first', title: 'First option' }]}
        />
        <Dropdown
          triggerButton={<button type="button">Open second</button>}
          options={[{ key: 'second', title: 'Second option' }]}
        />
      </>,
    );

    fireEvent.click(getByText('Open first'));
    expect(getByText('First option')).toBeInTheDocument();

    fireEvent.click(getByText('Open second'));
    expect(getByText('Second option')).toBeInTheDocument();

    await waitFor(() => {
      expect(queryByText('First option')).not.toBeInTheDocument();
    });
  });

  it('makes dropdown content scrollable', () => {
    const { container, getByText } = render(
      <Dropdown
        triggerButton={<button type="button">Open</button>}
        options={[{ key: 'option', title: 'Option' }]}
      />,
    );

    fireEvent.click(getByText('Open'));

    expect(container.querySelector('.dropdown-container')).toHaveStyle({
      overflowY: 'auto',
    });
  });
});
