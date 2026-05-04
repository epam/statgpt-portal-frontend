import { ReactNode } from 'react';
import { AlertType } from '../constants/alert';

export interface AlertActionDetails {
  text: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}

export interface AlertProgressDetails {
  current: number;
  total: number;
}

export interface AlertDetails {
  title?: string;
  text?: string;
  type: AlertType;
  action?: AlertActionDetails;
  progress?: AlertProgressDetails;
}
