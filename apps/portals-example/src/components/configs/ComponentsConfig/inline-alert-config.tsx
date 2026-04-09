import { InlineAlertConfig } from '@epam/statgpt-ui-components';

import ErrorIcon from '../../../../public/images/statuses/error.svg';
import WarningIcon from '../../../../public/images/statuses/warning.svg';
import InfoIcon from '../../../../public/images/statuses/info.svg';

export const InlineAlertCustomConfig: InlineAlertConfig = {
  icons: {
    error: <ErrorIcon className="size-4 text-semantic-error" />,
    warning: <WarningIcon className="size-4 text-semantic-warning" />,
    info: <InfoIcon className="size-4 text-neutrals-800" />,
    note: <InfoIcon className="size-4 text-hues-900" />,
  },
};
