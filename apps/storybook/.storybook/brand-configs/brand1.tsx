import React from 'react';
import { InlineAlertConfig } from '@epam/statgpt-ui-components';
import ErrorIcon from './assets/error.svg';
import WarningIcon from './assets/warning.svg';
import InfoIcon from './assets/info.svg';

export const brand1AlertConfig: InlineAlertConfig = {
  icons: {
    error: <ErrorIcon className="size-4 text-semantic-error" />,
    warning: <WarningIcon className="size-4 text-semantic-warning" />,
    info: <InfoIcon className="size-4 text-neutrals-800" />,
    note: <InfoIcon className="size-4 text-hues-900" />,
  },
};
