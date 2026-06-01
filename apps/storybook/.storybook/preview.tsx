import React, { useEffect } from 'react';
import type { ComponentType, FC } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import {
  InlineAlertProvider,
  type InlineAlertConfig,
} from '@epam/statgpt-ui-components';
import '@epam/statgpt-ui-components/scss/styles.scss';
import './preview-overrides.css';
import { brand1AlertConfig } from './brand-configs/brand1';
import { brand2AlertConfig } from './brand-configs/brand2';

const brandAlertConfigs: Record<string, InlineAlertConfig> = {
  brand1: brand1AlertConfig,
  brand2: brand2AlertConfig,
};

const BrandWrapper: FC<{ Story: ComponentType; brand: string }> = ({
  Story,
  brand,
}) => {
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
  return (
    <InlineAlertProvider value={brandAlertConfigs[brand]}>
      <Story />
    </InlineAlertProvider>
  );
};

const withBrand: Decorator = (Story, context) => {
  const brand = (context.globals.brand as string) ?? 'brand1';
  return <BrandWrapper Story={Story} brand={brand} />;
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
