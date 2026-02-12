import { ReactNode } from 'react';

export enum InlineAlertVariant {
  Info = 'info',
  Error = 'error',
  Warning = 'warning',
}

export interface InlineAlertIconsConfig {
  [InlineAlertVariant.Info]?: ReactNode;
  [InlineAlertVariant.Error]?: ReactNode;
  [InlineAlertVariant.Warning]?: ReactNode;
}

export interface InlineAlertConfig {
  icons?: InlineAlertIconsConfig;
  classes?: InlineAlertClassesConfig;
}

export interface InlineAlertClassesConfig {
  container?: string;
  variants?: Partial<Record<InlineAlertVariant, string>>;
  icon?: string;
  content?: string;
}
