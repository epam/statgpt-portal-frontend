import { FC } from 'react';
import classNames from 'classnames';

interface Props {
  firstLine?: string;
  secondLine?: string;
}

export const ChatFooter: FC<Props> = ({ firstLine, secondLine }) => {
  const showFirstLine = firstLine != null && firstLine.trim() !== '';
  const showSecondLine = secondLine != null && secondLine.trim() !== '';
  return (
    <div
      className={classNames(
        'text-center body-3',
        showSecondLine ? 'p-0' : showFirstLine ? 'p-1' : 'p-3',
      )}
    >
      {showFirstLine && <div className="text-neutrals-800">{firstLine}</div>}
      {showSecondLine && <div className="text-neutrals-800">{secondLine}</div>}
    </div>
  );
};
