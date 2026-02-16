'use client';

import { InlineAlertProvider } from '@epam/statgpt-ui-components';
import { ReactNode } from 'react';
import { InlineAlertCustomConfig } from './inline-alert-config';

export const ComponentsConfig = ({ children }: { children: ReactNode }) => (
  <InlineAlertProvider value={InlineAlertCustomConfig}>
    {children}
  </InlineAlertProvider>
);
