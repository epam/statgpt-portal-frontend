import type { InlineAlertConfig } from '@epam/statgpt-ui-components';

const moduleGlob = import.meta.glob<{
  localBrand1AlertConfig: InlineAlertConfig;
}>('./brand-configs/local-brand1/index.tsx', { eager: true });
const stylesGlob = import.meta.glob<string>(
  './brand-configs/local-brand1/styles.scss',
  { query: '?inline', import: 'default', eager: true },
);

const alertConfig =
  moduleGlob['./brand-configs/local-brand1/index.tsx']?.localBrand1AlertConfig;

export const localBrand = alertConfig
  ? {
      key: 'local-brand1' as const,
      title: 'Local Brand',
      alertConfig,
      styles: stylesGlob['./brand-configs/local-brand1/styles.scss'] ?? '',
    }
  : null;
