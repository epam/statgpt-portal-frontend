import React, { useEffect } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import '../../../libs/ui-components/src/scss/styles.scss';
import './preview-overrides.css';

const withBrand: Decorator = (Story, context) => {
  const brand = (context.globals.brand as string) ?? 'brand1';
  useEffect(() => {
    const existing = document.getElementById('brand-theme');
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.id = 'brand-theme';
    link.rel = 'stylesheet';
    link.href = `/brand-themes/${brand}.css`;
    document.head.appendChild(link);
    return () => {
      document.getElementById('brand-theme')?.remove();
    };
  }, [brand]);
  return <Story />;
};

const preview: Preview = {
  decorators: [withBrand],
  globalTypes: {
    brand: {
      description: 'Client brand',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'brand1', title: 'Brand 1' },
          { value: 'brand2', title: 'Brand 2' },
        ],
      },
    },
  },
  initialGlobals: {
    brand: 'brand1',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
