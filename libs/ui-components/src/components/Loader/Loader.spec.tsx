import React from 'react';
import { render } from '@testing-library/react';
import { Loader } from './Loader';

describe('Loader', () => {
  it('renders loader container and loader element', () => {
    const { container } = render(<Loader />);
    const flexDiv = container.querySelector(
      '.flex.items-center.justify-center.h-full',
    );
    const loaderDiv = container.querySelector('.loader');
    expect(flexDiv).toBeInTheDocument();
    expect(loaderDiv).toBeInTheDocument();
  });
});
