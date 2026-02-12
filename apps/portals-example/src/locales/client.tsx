'use client';

import { createI18nClient } from 'next-international/client';
import { ReactNode, useEffect } from 'react';

export const { useI18n, I18nProviderClient, useCurrentLocale } =
  createI18nClient({
    en: () => import('./en/common.json'),
  });

export type I18nTranslateFn = (
  key: string,
  options?: Record<string, unknown>,
) => string;

interface Props {
  locale: string;
  children: ReactNode;
}

export const I18nProvider = ({ locale, children }: Props) => {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nProviderClient locale={locale}>{children}</I18nProviderClient>;
};
