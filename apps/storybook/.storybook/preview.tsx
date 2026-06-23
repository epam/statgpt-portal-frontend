import React, { useEffect } from 'react';
import type { ComponentType, FC } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import {
  InlineAlertProvider,
  type InlineAlertConfig,
} from '@epam/statgpt-ui-components';
import '@epam/statgpt-ui-components/scss/styles.scss';
import 'flatpickr/dist/themes/light.css';
import './preview-overrides.css';
import { brand1AlertConfig } from './brand-configs/brand1/index';
import brand1Styles from './brand-configs/brand1/styles.scss?inline';
import { localBrand } from './local-brand';

const brandAlertConfigs: Record<string, InlineAlertConfig> = {
  brand1: brand1AlertConfig,
  ...(localBrand && { [localBrand.key]: localBrand.alertConfig }),
};

const brandComponentStyles: Record<string, string> = {
  brand1: brand1Styles,
  ...(localBrand && { [localBrand.key]: localBrand.styles }),
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

    const existingStyles = document.getElementById('brand-component-styles');
    if (existingStyles) existingStyles.remove();
    const style = document.createElement('style');
    style.id = 'brand-component-styles';
    style.textContent = brandComponentStyles[brand] ?? '';
    document.head.appendChild(style);

    return () => {
      document.getElementById('brand-theme')?.remove();
      document.getElementById('brand-component-styles')?.remove();
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
          ...(localBrand
            ? [{ value: localBrand.key, title: localBrand.title }]
            : []),
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
    docs: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      extractComponentDescription: (component: any) => {
        const raw: string | undefined = component?.__docgenInfo?.description;
        if (!raw) return undefined;
        return (
          raw
            .replace(/@example[\s\S]*?```[\s\S]*?```/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim() || undefined
        );
      },
    },
  },
};

export default preview;
