import { AlertType } from '../constants/alert';

export interface AlertDetails {
  title?: string;
  text?: string;
  type: AlertType;
}
