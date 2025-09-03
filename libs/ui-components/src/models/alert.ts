import { AlertType } from '@statgpt/ui-components/src/constants/alert';

export interface AlertDetails {
  title?: string;
  text?: string;
  type: AlertType;
}
