import { InlineAlertConfig } from '@epam/statgpt-ui-components';

import ErrorIcon from '../../../public/images/states/error.svg';
import WarningIcon from '../../../public/images/states/warning.svg';
import InfoIcon from '../../../public/images/states/info.svg';

export const InlineAlertCustomConfig: InlineAlertConfig = {
  icons: {
    error: <ErrorIcon className="size-4 text-semantic-error" />,
    warning: <WarningIcon className="size-4 text-semantic-warning" />,
    info: <InfoIcon className="size-4 text-neutrals-800" />,
  },
};
