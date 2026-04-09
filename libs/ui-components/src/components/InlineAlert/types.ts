import { ReactNode } from 'react';

export enum InlineAlertType {
  Info = 'info',
  Error = 'error',
  Warning = 'warning',
  Note = 'note',
}

export interface InlineAlertIconsConfig {
  [InlineAlertType.Info]?: ReactNode;
  [InlineAlertType.Error]?: ReactNode;
  [InlineAlertType.Warning]?: ReactNode;
  [InlineAlertType.Note]?: ReactNode;
}

export interface InlineAlertConfig {
  icons?: InlineAlertIconsConfig;
  classes?: InlineAlertClassesConfig;
}

export interface InlineAlertClassesConfig {
  container?: string;
  types?: Partial<Record<InlineAlertType, string>>;
  icon?: string;
  content?: string;
}
